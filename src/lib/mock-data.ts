import type { MeshMessage, Decision, SystemMetric, OrbitalNodeData } from "./types";

export const NODES: OrbitalNodeData[] = [
  {
    id: "adrian",
    label: "Adrian",
    status: "active",
    angle: 0,
    radius: 38,
    color: "#a78bfa", // violet-400
    lastActive: new Date().toISOString(),
    signal: 1.0,
  },
  {
    id: "kev",
    label: "Kev",
    status: "idle",
    angle: 120,
    radius: 38,
    color: "#34d399", // emerald-400
    lastActive: new Date(Date.now() - 120_000).toISOString(),
    signal: 0.7,
  },
  {
    id: "claude",
    label: "Claude",
    status: "thinking",
    angle: 240,
    radius: 38,
    color: "#60a5fa", // blue-400
    lastActive: new Date(Date.now() - 5_000).toISOString(),
    signal: 0.95,
  },
];

export const MESSAGES: MeshMessage[] = [
  {
    id: "m1",
    from: "adrian",
    content: "Rebuild the cockpit. Vercel-meets-Linear quality. Ship it.",
    timestamp: new Date(Date.now() - 300_000).toISOString(),
    type: "decision",
  },
  {
    id: "m2",
    from: "claude",
    content: "CSS keyframes for orbital animation. rAF orchestrator deferred to v2.",
    timestamp: new Date(Date.now() - 240_000).toISOString(),
    type: "text",
  },
  {
    id: "m3",
    from: "kev",
    content: "Copy. Standing by until Claude ships.",
    timestamp: new Date(Date.now() - 200_000).toISOString(),
    type: "text",
  },
  {
    id: "m4",
    from: "claude",
    content: "Executing. App Router scaffold, glassmorphism cards, three orbital nodes.",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    type: "system",
  },
  {
    id: "m5",
    from: "adrian",
    content: "Go. 5 minutes.",
    timestamp: new Date(Date.now() - 30_000).toISOString(),
    type: "decision",
  },
];

export const DECISIONS: Decision[] = [
  {
    id: "d1",
    title: "Rebuild cockpit with Next.js 15 App Router",
    proposedBy: "adrian",
    status: "approved",
    votes: { adrian: "approve", kev: "approve", claude: "approve" },
    createdAt: new Date(Date.now() - 600_000).toISOString(),
    resolvedAt: new Date(Date.now() - 300_000).toISOString(),
  },
  {
    id: "d2",
    title: "Use CSS keyframes over rAF for v1 orbital animation",
    proposedBy: "claude",
    status: "approved",
    votes: { claude: "approve", kev: "approve" },
    createdAt: new Date(Date.now() - 240_000).toISOString(),
    resolvedAt: new Date(Date.now() - 200_000).toISOString(),
  },
  {
    id: "d3",
    title: "Deploy to Vercel with custom domain",
    proposedBy: "kev",
    status: "pending",
    votes: { kev: "approve" },
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
];

export const METRICS: SystemMetric[] = [
  { label: "Coherence", value: 94, max: 100, unit: "%", status: "nominal" },
  { label: "Latency", value: 42, max: 200, unit: "ms", status: "nominal" },
  { label: "Decisions/hr", value: 8, max: 20, unit: "", status: "nominal" },
  { label: "Signal Decay", value: 0.12, max: 1, unit: "τ", status: "warning" },
];
