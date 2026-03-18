"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ExecutionContextData, PauseAckData } from "../lib/types";

// ─── Pause State Machine ────────────────────────────────────────────────────

type PauseState = "idle" | "pausing" | "paused" | "confirming" | "timeout";

// ─── Component ──────────────────────────────────────────────────────────────

export interface ExecutionContextProps {
  context: ExecutionContextData | null;
  pauseAck: PauseAckData | null;
  onPause: () => Promise<void>;
  onResume: () => void;
}

export function ExecutionContext({
  context,
  pauseAck,
  onPause,
  onResume,
}: ExecutionContextProps) {
  const [pauseState, setPauseState] = useState<PauseState>("idle");
  const [pauseError, setPauseError] = useState<string | null>(null);

  // Handle pause button tap
  const handlePauseClick = async () => {
    setPauseState("pausing");
    setPauseError(null);

    try {
      // Fire pause to Discord bridge
      await onPause();

      // Wait for pause_ack (3s SLA, then timeout)
      setPauseState("confirming");
      const timeout = setTimeout(() => {
        if (pauseState === "confirming") {
          setPauseState("timeout");
          setPauseError("Pause signal timeout (executor not responding)");
        }
      }, 3000);

      return () => clearTimeout(timeout);
    } catch (err) {
      setPauseState("idle");
      setPauseError(err instanceof Error ? err.message : "Pause failed");
    }
  };

  // When pause_ack arrives, freeze context
  useEffect(() => {
    if (pauseAck && pauseState === "confirming") {
      setPauseState("paused");
    }
  }, [pauseAck, pauseState]);

  if (!context) {
    return (
      <motion.div
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[11px] text-white/20 font-mono uppercase tracking-[0.2em]">
          No active task
        </p>
      </motion.div>
    );
  }

  const isFrozen = pauseState === "paused" || pauseState === "timeout";
  const contextData = isFrozen && pauseAck ? pauseAck : context;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${
          isFrozen ? "rgba(248, 113, 113, 0.12)" : "rgba(96, 165, 250, 0.12)"
        }`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                context.status === "active"
                  ? "#34d399"
                  : context.status === "paused"
                  ? "#fbbf24"
                  : "#9ca3af",
            }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40">
            {isFrozen ? "Context Frozen" : "Execution Context"}
          </span>
        </div>
        <span className="text-[9px] font-mono text-white/20">
          {"timestamp" in contextData
            ? new Date(contextData.timestamp).toLocaleTimeString("en-GB")
            : new Date().toLocaleTimeString("en-GB")}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Artifact */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono block mb-2">
            Artifact
          </label>
          <div
            className="rounded-lg p-3 font-mono text-[11px] leading-relaxed text-white/50 overflow-auto max-h-[120px] bg-white/[0.02] border border-white/[0.04]"
            style={{
              opacity: isFrozen ? 0.6 : 1,
            }}
          >
            {contextData.artifact}
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono block mb-2">
            Reasoning
          </label>
          <p
            className="text-[12px] leading-relaxed text-white/40"
            style={{
              opacity: isFrozen ? 0.6 : 1,
            }}
          >
            {contextData.reasoning}
          </p>
        </div>

        {/* Confidence */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono block mb-2">
            Confidence
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    contextData.confidence > 70
                      ? "#34d399"
                      : contextData.confidence > 40
                      ? "#fbbf24"
                      : "#f87171",
                }}
                animate={{ width: `${contextData.confidence}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] font-mono tabular text-white/30 min-w-[32px]">
              {Math.round(contextData.confidence)}%
            </span>
          </div>
        </div>

        {/* Pause options (when paused) */}
        <AnimatePresence>
          {pauseAck && pauseAck.options && pauseAck.options.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-white/[0.04]">
                <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-mono block mb-2">
                  Resolution Options
                </label>
                <div className="space-y-1.5">
                  {pauseAck.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <p className="text-[11px] text-white/40">{opt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {pauseError && (
            <motion.div
              className="p-2 rounded-lg bg-red-500/[0.08] border border-red-500/[0.2]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <p className="text-[10px] text-red-400/70 font-mono">
                {pauseError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: Pause / Resume Button */}
      <div className="px-4 py-3 border-t border-white/[0.04] flex gap-2">
        {!isFrozen ? (
          <motion.button
            onClick={handlePauseClick}
            disabled={context.status !== "active"}
            className="flex-1 px-4 py-2 rounded-xl font-mono text-[10px] uppercase tracking-[0.15em] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
            style={{
              background:
                pauseState === "pausing" || pauseState === "confirming"
                  ? "rgba(251, 191, 36, 0.1)"
                  : "rgba(96, 165, 250, 0.1)",
              border:
                pauseState === "pausing" || pauseState === "confirming"
                  ? "1px solid rgba(251, 191, 36, 0.25)"
                  : "1px solid rgba(96, 165, 250, 0.25)",
              color:
                pauseState === "pausing" || pauseState === "confirming"
                  ? "rgba(251, 191, 36, 0.8)"
                  : "rgba(96, 165, 250, 0.8)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {pauseState === "idle" && "⏸ Pause"}
            {pauseState === "pausing" && "Pausing..."}
            {pauseState === "confirming" && "Confirming..."}
          </motion.button>
        ) : (
          <motion.button
            onClick={onResume}
            className="flex-1 px-4 py-2 rounded-xl font-mono text-[10px] uppercase tracking-[0.15em] cursor-pointer"
            style={{
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              color: "rgba(52, 211, 153, 0.8)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ✓ Resume
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
