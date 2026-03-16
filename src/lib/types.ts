// ─── THE MESH Cockpit — Core Types ───────────────────────────────────────────

export type NodeRole = "adrian" | "kev" | "claude";

export type NodeStatus = "active" | "idle" | "thinking" | "offline";

export type SignalType = "message" | "decision" | "heartbeat" | "alert";

export interface OrbitalNodeData {
  id: NodeRole;
  label: string;
  status: NodeStatus;
  /** Orbital angle in degrees — set by the layout clock */
  angle: number;
  /** Orbital radius as percentage of container */
  radius: number;
  /** Accent color */
  color: string;
  /** Last active timestamp (ISO) */
  lastActive: string;
  /** Signal strength 0-1 (exponential decay from last activity) */
  signal: number;
}

export interface MeshMessage {
  id: string;
  from: NodeRole;
  content: string;
  timestamp: string;
  type: "text" | "decision" | "system";
}

export interface Decision {
  id: string;
  title: string;
  proposedBy: NodeRole;
  status: "pending" | "approved" | "rejected" | "deferred";
  votes: Partial<Record<NodeRole, "approve" | "reject" | "defer">>;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: "nominal" | "warning" | "critical";
}

export interface MeshState {
  nodes: OrbitalNodeData[];
  messages: MeshMessage[];
  decisions: Decision[];
  metrics: SystemMetric[];
  phaseAngle: number;
}
