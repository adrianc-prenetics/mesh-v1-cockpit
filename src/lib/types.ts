// ─── THE MESH Kill Switch — Core Types ──────────────────────────────────────

export type SystemId = "claude" | "kev" | "queue" | "deploys" | "im8";

export type PulseStatus = "alive" | "stale" | "dead";

export interface SystemPulse {
  id: SystemId;
  label: string;
  /** What the last motion was */
  lastMotion: string;
  /** ISO timestamp of last motion */
  lastMotionAt: string;
  /** Seconds before "stale", seconds before "dead" */
  thresholds: { stale: number; dead: number };
}

export interface KillSwitchState {
  systems: SystemPulse[];
  /** ISO timestamp of when this state was computed */
  asOf: string;
}

// ─── Decision Queue Types ───────────────────────────────────────────────────

export type DecisionStatus =
  | "pending"
  | "consolidating"
  | "committed"
  | "overridden";

export type DecisionPriority = "critical" | "high" | "normal" | "low";

export type MeshEntity = "claude" | "kev" | "adrian";

export interface Decision {
  id: string;
  title: string;
  description: string;
  submittedBy: MeshEntity;
  submittedAt: string; // ISO
  status: DecisionStatus;
  priority: DecisionPriority;
  /** Seconds remaining before auto-commit */
  consolidationTimer: number;
  /** Total seconds allocated for consolidation */
  consolidationTotal: number;
  friction: FrictionEntry[];
  tags: string[];
}

// ─── Friction Feed Types ────────────────────────────────────────────────────

export interface FrictionEntry {
  id: string;
  from: MeshEntity;
  content: string;
  timestamp: string; // ISO
  type: "insight" | "pushback" | "resolution" | "question";
  decisionId?: string;
}

// ─── Autonomy State ─────────────────────────────────────────────────────────

export interface AutonomyState {
  /** 0-100, current autonomy ceiling */
  ceiling: number;
  overridesRemaining: number;
  autoCommitEnabled: boolean;
  consolidationSpeed: "slow" | "normal" | "fast";
}

// ─── Full Cockpit State ─────────────────────────────────────────────────────

export interface CockpitState {
  decisions: Decision[];
  frictionFeed: FrictionEntry[];
  autonomy: AutonomyState;
  systems: SystemPulse[];
  asOf: string;
}
