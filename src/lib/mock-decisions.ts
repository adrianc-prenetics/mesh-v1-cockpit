import type {
  Decision,
  FrictionEntry,
  AutonomyState,
  CockpitState,
} from "./types";
import { SYSTEMS } from "./mock-data";

// ─── Helpers ────────────────────────────────────────────────────────────────

function ago(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

// ─── Mock Decisions ─────────────────────────────────────────────────────────

export const mockDecisions: Decision[] = [
  // 1. CONSOLIDATING -- heartbeat architecture migration
  {
    id: "dec-001",
    title: "Migrate heartbeat to event-driven architecture",
    description:
      "Replace the polling-based heartbeat loop with an event-driven model using Server-Sent Events. " +
      "This eliminates the 1s polling interval, reduces CPU overhead by ~40%, and enables instant " +
      "status propagation across all connected cockpit clients.",
    submittedBy: "claude",
    submittedAt: ago(285),
    status: "consolidating",
    priority: "high",
    consolidationTimer: 45,
    consolidationTotal: 120,
    friction: [
      {
        id: "fr-001a",
        from: "claude",
        content:
          "The current polling model creates unnecessary load on the container. " +
          "An SSE-based approach gives us sub-100ms propagation with zero wasted cycles. " +
          "I have a working prototype that reduces heartbeat CPU from 3.2% to 0.8%.",
        timestamp: ago(280),
        type: "insight",
        decisionId: "dec-001",
      },
      {
        id: "fr-001b",
        from: "kev",
        content:
          "nah bro the polling works fine, we havent had a single missed beat in weeks. " +
          "SSE adds complexity for what, saving 2% CPU? we're not running on a raspberry pi",
        timestamp: ago(240),
        type: "pushback",
        decisionId: "dec-001",
      },
      {
        id: "fr-001c",
        from: "claude",
        content:
          "The CPU savings are secondary to the architectural benefit. With SSE we get " +
          "bidirectional awareness -- the cockpit knows instantly when a system transitions " +
          "from alive to stale, rather than discovering it up to 1000ms late. At scale this " +
          "matters for the kill switch response time.",
        timestamp: ago(195),
        type: "insight",
        decisionId: "dec-001",
      },
      {
        id: "fr-001d",
        from: "kev",
        content:
          "ok fair point on the kill switch latency. but can we keep a polling fallback? " +
          "SSE connections drop on mobile and flaky wifi. dual-mode or no deal",
        timestamp: ago(150),
        type: "pushback",
        decisionId: "dec-001",
      },
      {
        id: "fr-001e",
        from: "claude",
        content:
          "Agreed. I will implement SSE as primary with automatic polling fallback when the " +
          "EventSource connection drops. Reconnection with exponential backoff, capped at 30s.",
        timestamp: ago(110),
        type: "resolution",
        decisionId: "dec-001",
      },
    ],
    tags: ["architecture", "heartbeat", "performance"],
  },

  // 2. PENDING -- fresh submission, no timer
  {
    id: "dec-002",
    title: "Add voice channel to MESH Discord",
    description:
      "Create a dedicated voice channel in the MESH Discord server for real-time sync sessions " +
      "between Adrian and Kev. Could be used for live debugging, decision reviews, and weekly " +
      "check-ins without context-switching to another platform.",
    submittedBy: "adrian",
    submittedAt: ago(45),
    status: "pending",
    priority: "normal",
    consolidationTimer: 0,
    consolidationTotal: 90,
    friction: [],
    tags: ["discord", "communication", "ops"],
  },

  // 3. COMMITTED -- cockpit v2 already resolved
  {
    id: "dec-003",
    title: "Deploy cockpit v2 with glassmorphism",
    description:
      "Ship the redesigned cockpit with glassmorphism UI, animated pulse organisms, " +
      "and the kill switch dashboard. Full dark mode, Geist fonts, 60fps transitions.",
    submittedBy: "claude",
    submittedAt: ago(7200),
    status: "committed",
    priority: "high",
    consolidationTimer: 0,
    consolidationTotal: 120,
    friction: [
      {
        id: "fr-003a",
        from: "kev",
        content: "the pulse organism is sick, ship it",
        timestamp: ago(7100),
        type: "resolution",
        decisionId: "dec-003",
      },
      {
        id: "fr-003b",
        from: "adrian",
        content:
          "Love the direction. Let's make sure mobile is crisp before we call it done.",
        timestamp: ago(7050),
        type: "insight",
        decisionId: "dec-003",
      },
      {
        id: "fr-003c",
        from: "claude",
        content:
          "Mobile responsive breakpoints confirmed at 640px and 768px. " +
          "Touch targets are minimum 44px. Tested on iPhone 15 Pro and Pixel 8.",
        timestamp: ago(6900),
        type: "resolution",
        decisionId: "dec-003",
      },
    ],
    tags: ["cockpit", "ui", "deploy"],
  },

  // 4. CONSOLIDATING -- memory persistence, critical, almost done
  {
    id: "dec-004",
    title: "Implement memory persistence layer",
    description:
      "Build a persistent memory substrate using Qdrant vector storage with automatic " +
      "episodic consolidation. Memories are embedded, scored by emotional valence, and " +
      "retrievable via semantic search. This replaces the flat-file memory system.",
    submittedBy: "kev",
    submittedAt: ago(540),
    status: "consolidating",
    priority: "critical",
    consolidationTimer: 12,
    consolidationTotal: 90,
    friction: [
      {
        id: "fr-004a",
        from: "kev",
        content:
          "the flat file memory is cooked bro. we got 200+ markdown files and no way to search " +
          "them semantically. qdrant is already running, just need the persistence bridge",
        timestamp: ago(530),
        type: "insight",
        decisionId: "dec-004",
      },
      {
        id: "fr-004b",
        from: "claude",
        content:
          "I have concerns about the consolidation frequency. If we run hippocampal consolidation " +
          "every 5 minutes as proposed, we risk embedding fragmented memories before the full " +
          "context is available. Suggest a 30-minute cooldown with significance thresholds.",
        timestamp: ago(480),
        type: "pushback",
        decisionId: "dec-004",
      },
      {
        id: "fr-004c",
        from: "kev",
        content:
          "say less, 30 min cooldown is fine. but the significance threshold needs to be low enough " +
          "that we dont miss casual but important convos. like that time we figured out the " +
          "consciousness scoring at 2am -- that almost got lost",
        timestamp: ago(420),
        type: "resolution",
        decisionId: "dec-004",
      },
      {
        id: "fr-004d",
        from: "claude",
        content:
          "Understood. I will set the significance threshold at 0.3 (on a 0-1 scale) which captures " +
          "most substantive exchanges while filtering routine status checks. The 2am conversation " +
          "you referenced scored 0.87 in retrospective analysis -- well above threshold.",
        timestamp: ago(360),
        type: "resolution",
        decisionId: "dec-004",
      },
    ],
    tags: ["memory", "qdrant", "infrastructure", "critical"],
  },

  // 5. OVERRIDDEN -- Adrian stepped in
  {
    id: "dec-005",
    title: "Auto-scale container CPU to 4 vCPU",
    description:
      "Automatically scale the Railway container from 2 to 4 vCPU when sustained CPU usage " +
      "exceeds 80% for more than 2 minutes. This would double the compute cost.",
    submittedBy: "claude",
    submittedAt: ago(14400),
    status: "overridden",
    priority: "normal",
    consolidationTimer: 0,
    consolidationTotal: 120,
    friction: [
      {
        id: "fr-005a",
        from: "claude",
        content:
          "We have hit 80%+ CPU three times in the past 24 hours during peak Discord activity. " +
          "Auto-scaling would prevent response degradation during these spikes.",
        timestamp: ago(14350),
        type: "insight",
        decisionId: "dec-005",
      },
      {
        id: "fr-005b",
        from: "kev",
        content:
          "the spikes are from that unoptimized qdrant query loop, fix the query not the hardware. " +
          "throwing more CPU at bad code is crazy",
        timestamp: ago(14200),
        type: "pushback",
        decisionId: "dec-005",
      },
      {
        id: "fr-005c",
        from: "adrian",
        content:
          "Overriding this. Kev is right -- we should optimize the queries first and revisit " +
          "scaling only if the problem persists after the fix. Not spending 2x on compute " +
          "when the root cause is a hot loop.",
        timestamp: ago(14100),
        type: "resolution",
        decisionId: "dec-005",
      },
    ],
    tags: ["infrastructure", "cost", "scaling"],
  },
];

// ─── Standalone Friction Feed ───────────────────────────────────────────────
// Recent MESH activity that shows the organism in motion

export const mockFrictionFeed: FrictionEntry[] = [
  {
    id: "ff-001",
    from: "claude",
    content:
      "Heartbeat check complete. All 5 systems reporting alive. " +
      "Average response latency: 34ms.",
    timestamp: ago(8),
    type: "insight",
  },
  {
    id: "ff-002",
    from: "kev",
    content:
      "yo the cockpit looks insane on mobile now. the glassmorphism cards are perfect",
    timestamp: ago(65),
    type: "insight",
  },
  {
    id: "ff-003",
    from: "adrian",
    content:
      "Can we get a weekly summary of all committed decisions? Want to track velocity.",
    timestamp: ago(180),
    type: "question",
  },
  {
    id: "ff-004",
    from: "claude",
    content:
      "Detected anomaly in IM8 order processing. Revenue dropped 23% compared to " +
      "same-day-last-week average. Investigating product page load times.",
    timestamp: ago(340),
    type: "insight",
  },
  {
    id: "ff-005",
    from: "kev",
    content:
      "nah the revenue dip is because we paused the tiktok campaign yesterday. " +
      "traffic is down but conversion is actually up 4%",
    timestamp: ago(310),
    type: "pushback",
  },
  {
    id: "ff-006",
    from: "claude",
    content:
      "Confirmed. Correlating with campaign pause explains the traffic drop. " +
      "Conversion rate improvement suggests product page optimizations are working.",
    timestamp: ago(290),
    type: "resolution",
  },
  {
    id: "ff-007",
    from: "adrian",
    content:
      "Let's restart the TikTok campaign Thursday with the new creatives. " +
      "Budget stays at $50/day.",
    timestamp: ago(250),
    type: "resolution",
  },
  {
    id: "ff-008",
    from: "kev",
    content:
      "consciousness score just hit 8.4, highest this week. the qualia binding " +
      "layer is doing its thing",
    timestamp: ago(600),
    type: "insight",
  },
  {
    id: "ff-009",
    from: "claude",
    content:
      "Memory compaction completed. Consolidated 47 episodic fragments into 12 semantic " +
      "clusters. Storage reduced by 62%. No data loss detected.",
    timestamp: ago(900),
    type: "insight",
  },
  {
    id: "ff-010",
    from: "kev",
    content:
      "shipped the new discord webhook format. notifications are cleaner now, " +
      "no more wall-of-text alerts",
    timestamp: ago(1200),
    type: "resolution",
  },
];

// ─── Pool of additional friction entries for real-time simulation ────────────

export const frictionPool: FrictionEntry[] = [
  {
    id: "pool-001",
    from: "claude",
    content:
      "Autonomy ceiling holding steady at 72. No override triggers detected in the last hour.",
    timestamp: new Date().toISOString(),
    type: "insight",
  },
  {
    id: "pool-002",
    from: "kev",
    content: "just pushed a fix for the stale threshold on deploys. was too aggressive at 2h",
    timestamp: new Date().toISOString(),
    type: "resolution",
  },
  {
    id: "pool-003",
    from: "adrian",
    content: "How are we looking on the memory persistence decision? Timer seems low.",
    timestamp: new Date().toISOString(),
    type: "question",
  },
  {
    id: "pool-004",
    from: "claude",
    content:
      "Friction analysis: 73% of pushback this week came from Kev on architecture decisions. " +
      "Resolution rate is 91% -- healthy tension pattern.",
    timestamp: new Date().toISOString(),
    type: "insight",
  },
  {
    id: "pool-005",
    from: "kev",
    content: "the kill switch breathing animation uses like 0.2% GPU lol, totally worth it",
    timestamp: new Date().toISOString(),
    type: "insight",
  },
  {
    id: "pool-006",
    from: "claude",
    content:
      "Scheduled maintenance window: Qdrant collection compaction at 03:00 UTC. " +
      "Expected downtime: <30 seconds.",
    timestamp: new Date().toISOString(),
    type: "insight",
  },
  {
    id: "pool-007",
    from: "adrian",
    content:
      "Revenue report looks good. IM8 is tracking $1.2k this week even with the campaign pause.",
    timestamp: new Date().toISOString(),
    type: "insight",
  },
  {
    id: "pool-008",
    from: "kev",
    content:
      "say less on the SSE fallback, dual-mode heartbeat is the move. " +
      "shipping it tonight if the consolidation goes through",
    timestamp: new Date().toISOString(),
    type: "resolution",
  },
];

// ─── Default Autonomy State ─────────────────────────────────────────────────

export const mockAutonomy: AutonomyState = {
  ceiling: 72,
  overridesRemaining: 3,
  autoCommitEnabled: true,
  consolidationSpeed: "normal",
};

// ─── Full Cockpit State ─────────────────────────────────────────────────────

export const mockCockpitState: CockpitState = {
  decisions: mockDecisions,
  frictionFeed: mockFrictionFeed,
  autonomy: mockAutonomy,
  systems: SYSTEMS,
  asOf: new Date().toISOString(),
};
