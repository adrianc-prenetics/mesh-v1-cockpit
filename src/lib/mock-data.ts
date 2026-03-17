import type { SystemPulse } from "./types";

// Mock: simulate real system pulse data.
// In production these come from an API that checks actual last-motion timestamps.

export const SYSTEMS: SystemPulse[] = [
  {
    id: "claude",
    label: "Claude",
    lastMotion: "Executor fired — reviewed PR #47",
    lastMotionAt: new Date(Date.now() - 12_000).toISOString(), // 12s ago
    thresholds: { stale: 300, dead: 900 }, // 5m stale, 15m dead
  },
  {
    id: "kev",
    label: "Kev",
    lastMotion: "Discord message in #mesh-ops",
    lastMotionAt: new Date(Date.now() - 127_000).toISOString(), // ~2m ago
    thresholds: { stale: 600, dead: 3600 }, // 10m stale, 1h dead
  },
  {
    id: "queue",
    label: "Queue",
    lastMotion: "Decision resolved — cockpit architecture approved",
    lastMotionAt: new Date(Date.now() - 310_000).toISOString(), // ~5m ago
    thresholds: { stale: 1800, dead: 7200 }, // 30m stale, 2h dead
  },
  {
    id: "deploys",
    label: "Deploys",
    lastMotion: "mesh-v1-cockpit deployed to Vercel",
    lastMotionAt: new Date(Date.now() - 3_420_000).toISOString(), // ~57m ago
    thresholds: { stale: 7200, dead: 86400 }, // 2h stale, 24h dead
  },
  {
    id: "im8",
    label: "IM8",
    lastMotion: "3 orders processed — $247 revenue",
    lastMotionAt: new Date(Date.now() - 10_800_000).toISOString(), // 3h ago
    thresholds: { stale: 14400, dead: 86400 }, // 4h stale, 24h dead
  },
];
