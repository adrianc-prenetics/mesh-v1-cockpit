import { NextResponse } from "next/server";

// ─── Real pulse sources ─────────────────────────────────────────────────────
// Each function returns { lastMotion, lastMotionAt } or null on failure.

interface PulseResult {
  lastMotion: string;
  lastMotionAt: string;
}

const GH_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_uC5Akz4aelUbSbpQhPBDvgYAINdn";

const GH_HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "mesh-cockpit",
};

// Claude: last commit to mesh-v1-cockpit repo (Claude is the only one committing here)
async function getClaude(): Promise<PulseResult | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/adrianc-prenetics/mesh-v1-cockpit/commits?per_page=1",
      { headers: GH_HEADERS, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data[0];
    return {
      lastMotion: `Commit ${c.sha.slice(0, 7)} — ${c.commit.message.split("\n")[0].slice(0, 60)}`,
      lastMotionAt: c.commit.committer.date,
    };
  } catch {
    return null;
  }
}

// Kev: last commit to the main repo (unpaidinternkev-v2)
async function getKev(): Promise<PulseResult | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/adrianc-prenetics/unpaidinternkev-v2/commits?per_page=1",
      { headers: GH_HEADERS, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data[0];
    return {
      lastMotion: `Commit ${c.sha.slice(0, 7)} — ${c.commit.message.split("\n")[0].slice(0, 60)}`,
      lastMotionAt: c.commit.committer.date,
    };
  } catch {
    return null;
  }
}

// Queue: last closed issue or merged PR across repos
async function getQueue(): Promise<PulseResult | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/adrianc-prenetics/unpaidinternkev-v2/issues?state=closed&sort=updated&per_page=1",
      { headers: GH_HEADERS, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return { lastMotion: "No resolved issues yet", lastMotionAt: new Date(0).toISOString() };
    const issue = data[0];
    return {
      lastMotion: `Resolved #${issue.number} — ${issue.title.slice(0, 50)}`,
      lastMotionAt: issue.closed_at || issue.updated_at,
    };
  } catch {
    return null;
  }
}

// Deploys: last Vercel deployment
async function getDeploys(): Promise<PulseResult | null> {
  if (!VERCEL_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1&state=READY`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.deployments?.length) return null;
    const d = data.deployments[0];
    return {
      lastMotion: `Deployed ${d.meta?.githubCommitMessage?.split("\n")[0]?.slice(0, 50) || d.url}`,
      lastMotionAt: new Date(d.createdAt).toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── System configs ─────────────────────────────────────────────────────────

const SYSTEM_CONFIGS = [
  { id: "claude", label: "Claude", fetcher: getClaude, thresholds: { stale: 3600, dead: 14400 } },
  { id: "kev", label: "Kev", fetcher: getKev, thresholds: { stale: 3600, dead: 14400 } },
  { id: "queue", label: "Queue", fetcher: getQueue, thresholds: { stale: 7200, dead: 86400 } },
  { id: "deploys", label: "Deploys", fetcher: getDeploys, thresholds: { stale: 7200, dead: 86400 } },
  { id: "im8", label: "IM8", fetcher: async () => null, thresholds: { stale: 14400, dead: 86400 } },
] as const;

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled(
    SYSTEM_CONFIGS.map(async (sys) => {
      const pulse = await sys.fetcher();
      return {
        id: sys.id,
        label: sys.label,
        lastMotion: pulse?.lastMotion ?? "NOT WIRED",
        lastMotionAt: pulse?.lastMotionAt ?? new Date(0).toISOString(),
        thresholds: sys.thresholds,
        wired: pulse !== null,
      };
    })
  );

  const systems = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { id: "unknown", label: "Error", lastMotion: "Fetch failed", lastMotionAt: new Date(0).toISOString(), thresholds: { stale: 300, dead: 900 }, wired: false }
  );

  return NextResponse.json(
    { systems, asOf: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
