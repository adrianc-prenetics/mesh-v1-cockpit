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
