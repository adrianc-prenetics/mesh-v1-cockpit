"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemPulse, PulseStatus } from "../lib/types";

// ─── Pulse math ─────────────────────────────────────────────────────────────

function getAge(isoTimestamp: string): number {
  return Math.max(0, (Date.now() - new Date(isoTimestamp).getTime()) / 1000);
}

function getStatus(pulse: SystemPulse): PulseStatus {
  const age = getAge(pulse.lastMotionAt);
  if (age >= pulse.thresholds.dead) return "dead";
  if (age >= pulse.thresholds.stale) return "stale";
  return "alive";
}

function formatAge(isoTimestamp: string): string {
  const s = Math.floor(getAge(isoTimestamp));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PulseStatus, { color: string; glow: string; label: string }> = {
  alive: { color: "#34d399", glow: "0 0 12px #34d39960", label: "MOVING" },
  stale: { color: "#fbbf24", glow: "0 0 12px #fbbf2440", label: "STALE" },
  dead: { color: "#f87171", glow: "0 0 16px #f8717160", label: "DEAD" },
};

// ─── Pulse row ──────────────────────────────────────────────────────────────

function PulseRow({ pulse, index }: { pulse: SystemPulse; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [age, setAge] = useState(formatAge(pulse.lastMotionAt));
  const status = getStatus(pulse);
  const config = STATUS_CONFIG[status];

  // Tick the age counter
  useEffect(() => {
    const interval = setInterval(() => {
      setAge(formatAge(pulse.lastMotionAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [pulse.lastMotionAt]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center gap-4 py-4 px-1 border-b border-white/[0.04] group-hover:border-white/[0.08] transition-colors">
          {/* Pulse dot */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: config.color, boxShadow: config.glow }}
              animate={
                status === "alive"
                  ? { scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }
                  : status === "dead"
                  ? { opacity: [1, 0.4, 1] }
                  : {}
              }
              transition={{ duration: status === "alive" ? 2 : 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* System name */}
          <span className="text-sm font-semibold text-white/70 tracking-[0.15em] uppercase w-20 flex-shrink-0">
            {pulse.label}
          </span>

          {/* Age — the core signal */}
          <span className="text-lg font-mono font-semibold tabular-nums text-white/90 flex-1">
            {age}
            <span className="text-[10px] text-white/25 ml-1.5 font-sans tracking-wider">ago</span>
          </span>

          {/* Status badge */}
          <span
            className="text-[10px] font-medium uppercase tracking-[0.2em] flex-shrink-0"
            style={{ color: config.color }}
          >
            {config.label}
          </span>

          {/* Expand chevron */}
          <motion.span
            className="text-white/20 text-xs flex-shrink-0"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            v
          </motion.span>
        </div>
      </button>

      {/* Expanded: what moved */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-8 pr-1 py-3 border-b border-white/[0.04]">
              <p className="text-[13px] text-white/40 leading-relaxed">
                {pulse.lastMotion}
              </p>
              <p className="text-[11px] text-white/20 mt-1 font-mono tabular-nums">
                {new Date(pulse.lastMotionAt).toLocaleString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Kill Switch ────────────────────────────────────────────────────────────

function getOverallStatus(systems: SystemPulse[]): PulseStatus {
  const statuses = systems.map(getStatus);
  if (statuses.includes("dead")) return "dead";
  if (statuses.includes("stale")) return "stale";
  return "alive";
}

export function KillSwitch({ systems }: { systems: SystemPulse[] }) {
  const [, setTick] = useState(0);
  const overall = getOverallStatus(systems);
  const config = STATUS_CONFIG[overall];

  // Force re-render every second to update ages
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const aliveCount = systems.filter((s) => getStatus(s) === "alive").length;
  const totalCount = systems.length;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header pulse — the ONE thing Adrian sees */}
      <motion.div
        className="flex flex-col items-center mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Main pulse ring */}
        <div className="relative mb-5">
          <motion.div
            className="h-16 w-16 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: config.color,
              boxShadow: `0 0 40px ${config.color}30, inset 0 0 20px ${config.color}10`,
            }}
            animate={
              overall === "alive"
                ? {
                    boxShadow: [
                      `0 0 40px ${config.color}30, inset 0 0 20px ${config.color}10`,
                      `0 0 60px ${config.color}50, inset 0 0 30px ${config.color}20`,
                      `0 0 40px ${config.color}30, inset 0 0 20px ${config.color}10`,
                    ],
                  }
                : overall === "dead"
                ? { opacity: [1, 0.5, 1] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: config.color }}
              animate={{
                scale: overall === "alive" ? [1, 1.3, 1] : [1, 0.8, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Ripple on alive */}
          {overall === "alive" && (
            <motion.div
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: config.color }}
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </div>

        {/* Status summary */}
        <p className="text-[11px] uppercase tracking-[0.3em] font-medium" style={{ color: config.color }}>
          {overall === "alive" ? "All systems moving" : overall === "stale" ? "Something slowing" : "System down"}
        </p>
        <p className="text-[10px] text-white/20 mt-1 font-mono tabular-nums">
          {aliveCount}/{totalCount} alive
        </p>
      </motion.div>

      {/* System pulses — the detail */}
      <div>
        {systems.map((pulse, i) => (
          <PulseRow key={pulse.id} pulse={pulse} index={i} />
        ))}
      </div>
    </div>
  );
}
