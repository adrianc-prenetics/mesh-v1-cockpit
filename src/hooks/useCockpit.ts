"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  CockpitState,
  Decision,
  DecisionPriority,
  FrictionEntry,
} from "../lib/types";
import {
  mockCockpitState,
  frictionPool,
} from "../lib/mock-decisions";

// ─── Action Types ───────────────────────────────────────────────────────────

type CockpitAction =
  | { type: "TICK" }
  | { type: "OVERRIDE_DECISION"; id: string }
  | { type: "REPRIORITIZE"; id: string; priority: DecisionPriority }
  | { type: "ADJUST_AUTONOMY"; ceiling: number }
  | { type: "ADD_FRICTION"; entry: FrictionEntry };

// ─── Reducer ────────────────────────────────────────────────────────────────

function cockpitReducer(
  state: CockpitState,
  action: CockpitAction
): CockpitState {
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

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseCockpitReturn {
  state: CockpitState;
  overrideDecision: (id: string) => void;
  reprioritize: (id: string, priority: DecisionPriority) => void;
  adjustAutonomy: (ceiling: number) => void;
}

export function useCockpit(): UseCockpitReturn {
  const [state, dispatch] = useReducer(cockpitReducer, mockCockpitState);
  const poolIndexRef = useRef(0);
  const nextFrictionRef = useRef(
    Date.now() + randomInterval()
  );

  // Tick every second -- decrements consolidation timers
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic friction injection -- checks every second, fires every 8-12s
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

  return {
    state,
    overrideDecision,
    reprioritize,
    adjustAutonomy,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a random interval between 8000ms and 12000ms */
function randomInterval(): number {
  return 8000 + Math.floor(Math.random() * 4000);
}
