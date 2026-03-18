"use client";

import { useReducer, useEffect, useCallback, useRef, useState } from "react";
import type {
  CockpitState,
  Decision,
  DecisionPriority,
  ExecutionContextData,
  FrictionEntry,
  PauseAckData,
  SystemPulse,
} from "../lib/types";
import {
  mockCockpitState,
  frictionPool,
} from "../lib/mock-decisions";

// Re-export for backward compatibility
export type { ExecutionContextData, PauseAckData } from "../lib/types";

// ─── Connection Status ──────────────────────────────────────────────────────

export type ConnectionStatus = "connecting" | "live" | "offline";

// ─── Action Types ───────────────────────────────────────────────────────────

type CockpitAction =
  | { type: "TICK" }
  | { type: "OVERRIDE_DECISION"; id: string }
  | { type: "REPRIORITIZE"; id: string; priority: DecisionPriority }
  | { type: "ADJUST_AUTONOMY"; ceiling: number }
  | { type: "ADD_FRICTION"; entry: FrictionEntry }
  | { type: "SET_EXECUTION_CONTEXT"; context: ExecutionContextData | null }
  | { type: "SET_PAUSE_ACK"; ack: PauseAckData | null }
  | { type: "SYNC_SYSTEMS"; systems: SystemPulse[]; asOf: string }
  | { type: "RESUME_TASK"; taskId: string }
  | { type: "TOGGLE_AUTO_COMMIT" }
  | { type: "SET_CONSOLIDATION_SPEED"; speed: "slow" | "normal" | "fast" };

// ─── Extended Cockpit State ─────────────────────────────────────────────────

interface ExtendedCockpitState extends CockpitState {
  executionContext: ExecutionContextData | null;
  pauseAck: PauseAckData | null;
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function cockpitReducer(
  state: ExtendedCockpitState,
  action: CockpitAction
): ExtendedCockpitState {
  switch (action.type) {
    case "TICK": {
      let changed = false;
      const decisions = state.decisions.map((d): Decision => {
        if (d.status !== "consolidating" || d.consolidationTimer <= 0) return d;
        changed = true;
        const nextTimer = d.consolidationTimer - 1;
        if (nextTimer <= 0) {
          return {
            ...d,
            consolidationTimer: 0,
            status: "committed",
          };
        }
        return { ...d, consolidationTimer: nextTimer };
      });

      if (!changed) return state;

      return {
        ...state,
        decisions,
        asOf: new Date().toISOString(),
      };
    }

    case "OVERRIDE_DECISION": {
      const idx = state.decisions.findIndex((d) => d.id === action.id);
      if (idx === -1) return state;

      const decision = state.decisions[idx];
      if (
        decision.status !== "consolidating" &&
        decision.status !== "pending"
      ) {
        return state;
      }

      if (state.autonomy.overridesRemaining <= 0) return state;

      const overrideFriction: FrictionEntry = {
        id: `fr-override-${Date.now()}`,
        from: "adrian",
        content: `Decision "${decision.title}" overridden by Adrian.`,
        timestamp: new Date().toISOString(),
        type: "resolution",
        decisionId: decision.id,
      };

      const updatedDecision: Decision = {
        ...decision,
        status: "overridden",
        consolidationTimer: 0,
        friction: [...decision.friction, overrideFriction],
      };

      const decisions = [...state.decisions];
      decisions[idx] = updatedDecision;

      return {
        ...state,
        decisions,
        autonomy: {
          ...state.autonomy,
          overridesRemaining: state.autonomy.overridesRemaining - 1,
        },
        frictionFeed: [overrideFriction, ...state.frictionFeed],
        asOf: new Date().toISOString(),
      };
    }

    case "REPRIORITIZE": {
      const idx = state.decisions.findIndex((d) => d.id === action.id);
      if (idx === -1) return state;

      const decision = state.decisions[idx];
      if (decision.priority === action.priority) return state;

      const decisions = [...state.decisions];
      decisions[idx] = { ...decision, priority: action.priority };

      return {
        ...state,
        decisions,
        asOf: new Date().toISOString(),
      };
    }

    case "ADJUST_AUTONOMY": {
      const ceiling = Math.max(0, Math.min(100, action.ceiling));
      if (ceiling === state.autonomy.ceiling) return state;

      return {
        ...state,
        autonomy: { ...state.autonomy, ceiling },
        asOf: new Date().toISOString(),
      };
    }

    case "ADD_FRICTION": {
      return {
        ...state,
        frictionFeed: [action.entry, ...state.frictionFeed].slice(0, 50),
        asOf: new Date().toISOString(),
      };
    }

    case "SET_EXECUTION_CONTEXT": {
      return {
        ...state,
        executionContext: action.context,
      };
    }

    case "SET_PAUSE_ACK": {
      return {
        ...state,
        pauseAck: action.ack,
      };
    }

    case "SYNC_SYSTEMS": {
      return {
        ...state,
        systems: action.systems,
        asOf: action.asOf,
      };
    }

    case "RESUME_TASK": {
      return {
        ...state,
        pauseAck: null,
        executionContext: state.executionContext
          ? { ...state.executionContext, status: "active" as const }
          : null,
      };
    }

    case "TOGGLE_AUTO_COMMIT": {
      return {
        ...state,
        autonomy: {
          ...state.autonomy,
          autoCommitEnabled: !state.autonomy.autoCommitEnabled,
        },
        asOf: new Date().toISOString(),
      };
    }

    case "SET_CONSOLIDATION_SPEED": {
      return {
        ...state,
        autonomy: {
          ...state.autonomy,
          consolidationSpeed: action.speed,
        },
        asOf: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseCockpitReturn {
  state: ExtendedCockpitState;
  overrideDecision: (id: string) => void;
  reprioritize: (id: string, priority: DecisionPriority) => void;
  adjustAutonomy: (ceiling: number) => void;
  pause: (taskId: string) => Promise<void>;
  resume: (taskId: string) => void;
  toggleAutoCommit: () => void;
  setConsolidationSpeed: (speed: "slow" | "normal" | "fast") => void;
  executionContext: ExecutionContextData | null;
  pauseAck: PauseAckData | null;
  connectionStatus: ConnectionStatus;
}

export function useCockpit(): UseCockpitReturn {
  const initialState: ExtendedCockpitState = {
    ...mockCockpitState,
    executionContext: null,
    pauseAck: null,
  };

  const [state, dispatch] = useReducer(cockpitReducer, initialState);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const poolIndexRef = useRef(0);
  const nextFrictionRef = useRef(
    Date.now() + randomInterval()
  );
  const sseRef = useRef<EventSource | null>(null);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live system data from /api/pulse
  useEffect(() => {
    let mounted = true;

    async function fetchPulse() {
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted && data.systems) {
          dispatch({
            type: "SYNC_SYSTEMS",
            systems: data.systems,
            asOf: data.asOf || new Date().toISOString(),
          });
          setConnectionStatus("live");
        }
      } catch {
        if (mounted) setConnectionStatus("offline");
      }
    }

    fetchPulse();
    const interval = setInterval(fetchPulse, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Periodic friction injection
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < nextFrictionRef.current) return;

      const idx = poolIndexRef.current % frictionPool.length;
      const template = frictionPool[idx];
      poolIndexRef.current += 1;

      const entry: FrictionEntry = {
        ...template,
        id: `live-${Date.now()}-${idx}`,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "ADD_FRICTION", entry });
      nextFrictionRef.current = now + randomInterval();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // SSE listener for pause_ack from Discord bridge
  useEffect(() => {
    sseRef.current = new EventSource("/api/mesh-events");

    sseRef.current.addEventListener("pause_ack", (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const ack = JSON.parse(customEvent.data) as PauseAckData;
        dispatch({ type: "SET_PAUSE_ACK", ack });
      } catch (e) {
        console.error("Failed to parse pause_ack:", e);
      }
    });

    sseRef.current.addEventListener("execution_context", (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const context = JSON.parse(customEvent.data) as ExecutionContextData;
        dispatch({ type: "SET_EXECUTION_CONTEXT", context });
      } catch (e) {
        console.error("Failed to parse execution_context:", e);
      }
    });

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  const pause = useCallback(async (taskId: string) => {
    try {
      const response = await fetch("/api/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, source: "cockpit" }),
      });

      if (!response.ok) {
        throw new Error(`Pause request failed: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Pause error:", err);
      throw err;
    }
  }, []);

  const resume = useCallback((taskId: string) => {
    dispatch({ type: "RESUME_TASK", taskId });

    // Notify Discord bridge
    fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    }).catch(console.error);
  }, []);

  const overrideDecision = useCallback((id: string) => {
    dispatch({ type: "OVERRIDE_DECISION", id });
  }, []);

  const reprioritize = useCallback(
    (id: string, priority: DecisionPriority) => {
      dispatch({ type: "REPRIORITIZE", id, priority });
    },
    []
  );

  const adjustAutonomy = useCallback((ceiling: number) => {
    dispatch({ type: "ADJUST_AUTONOMY", ceiling });
  }, []);

  const toggleAutoCommit = useCallback(() => {
    dispatch({ type: "TOGGLE_AUTO_COMMIT" });
  }, []);

  const setConsolidationSpeed = useCallback((speed: "slow" | "normal" | "fast") => {
    dispatch({ type: "SET_CONSOLIDATION_SPEED", speed });
  }, []);

  return {
    state,
    overrideDecision,
    reprioritize,
    adjustAutonomy,
    pause,
    resume,
    toggleAutoCommit,
    setConsolidationSpeed,
    executionContext: state.executionContext,
    pauseAck: state.pauseAck,
    connectionStatus,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a random interval between 8000ms and 12000ms */
function randomInterval(): number {
  return 8000 + Math.floor(Math.random() * 4000);
}
