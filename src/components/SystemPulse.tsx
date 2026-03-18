"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemPulse as SystemPulseType, PulseStatus } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAge(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
}

function getStatus(pulse: SystemPulseType): PulseStatus {
  const age = getAge(pulse.lastMotionAt);
  if (age >= pulse.thresholds.dead) return "dead";
  if (age >= pulse.thresholds.stale) return "stale";
  return "alive";
}

function formatRelativeAge(iso: string): string {
  const s = Math.floor(getAge(iso));
  // Epoch or very old = not wired
  if (s > 365 * 86400) return "Not wired";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m ago`;
  }
  const d = Math.floor(s / 86400);
  return `${d}d ago`;
}

// ---------------------------------------------------------------------------
// Status color config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  PulseStatus,
  { dot: string; glow: string; ring: string }
> = {
  alive: {
    dot: "#34d399",
    glow: "0 0 8px rgba(52, 211, 153, 0.5), 0 0 20px rgba(52, 211, 153, 0.15)",
    ring: "rgba(52, 211, 153, 0.2)",
  },
  stale: {
    dot: "#fbbf24",
    glow: "0 0 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(251, 191, 36, 0.1)",
    ring: "rgba(251, 191, 36, 0.15)",
  },
  dead: {
    dot: "#f87171",
    glow: "0 0 8px rgba(248, 113, 113, 0.5), 0 0 20px rgba(248, 113, 113, 0.15)",
    ring: "rgba(248, 113, 113, 0.2)",
  },
};

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function PulseTooltip({
  system,
  status,
}: {
  system: SystemPulseType;
  status: PulseStatus;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute top-full left-1/2 mt-3 pointer-events-none"
      style={{ transform: "translateX(-50%)", zIndex: 9999 }}
    >
      <div
        className="relative px-4 py-3 rounded-xl min-w-[180px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Notch arrow */}
        <div
          className="absolute -top-1 left-1/2 w-2 h-2 rotate-45"
          style={{
            transform: "translateX(-50%) rotate(45deg)",
            background: "rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        {/* System name + status */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: config.dot }}
          />
          <span className="text-[11px] font-medium text-white/90 tracking-wide">
            {system.label}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-mono ml-auto"
            style={{ color: config.dot, opacity: 0.8 }}
          >
            {status}
          </span>
        </div>

        {/* Last motion */}
        <p className="text-[10px] text-white/40 leading-relaxed mb-1.5">
          {system.lastMotion}
        </p>

        {/* Age */}
        <p className="text-[10px] font-mono text-white/25 tabular">
          {formatRelativeAge(system.lastMotionAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Individual dot
// ---------------------------------------------------------------------------

function PulseDot({ system }: { system: SystemPulseType }) {
  const [hovered, setHovered] = useState(false);
  const [status, setStatus] = useState<PulseStatus>(() => getStatus(system));

  // Refresh status every second for live aging
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getStatus(system));
    }, 1000);
    return () => clearInterval(interval);
  }, [system]);

  const config = STATUS_CONFIG[status];

  // Breathing speed varies by urgency
  const breathDuration = status === "alive" ? 3 : status === "stale" ? 2 : 1.2;

  return (
    <div
      className="relative flex flex-col items-center gap-2 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label */}
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-mono select-none">
        {system.label}
      </span>

      {/* Dot container */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Outer ring -- breathes */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${config.ring}` }}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.3, 0.08, 0.3],
          }}
          transition={{
            duration: breathDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Mid ring -- breathes offset */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "65%",
            height: "65%",
            border: `1px solid ${config.ring}`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{
            duration: breathDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: breathDuration * 0.3,
          }}
        />

        {/* Core dot */}
        <motion.div
          className="relative z-10 w-2.5 h-2.5 rounded-full"
          style={{
            background: config.dot,
            boxShadow: config.glow,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: breathDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.3 }}
        />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && <PulseTooltip system={system} status={status} />}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Pulse strip
// ---------------------------------------------------------------------------

export interface SystemPulseProps {
  systems: SystemPulseType[];
}

export function SystemPulse({ systems }: SystemPulseProps) {
  // Force re-render for live time display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const now = useCallback(() => {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className="relative flex items-center justify-center gap-8 sm:gap-12 px-6 py-4 rounded-2xl mx-auto max-w-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Left time stamp */}
        <span className="absolute left-4 bottom-1.5 text-[8px] font-mono text-white/10 tabular select-none">
          {now()}
        </span>

        {/* Dots */}
        {systems.map((system, i) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: i * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <PulseDot system={system} />
          </motion.div>
        ))}

        {/* Right label */}
        <span className="absolute right-4 bottom-1.5 text-[8px] font-mono text-white/10 uppercase tracking-[0.2em] select-none">
          vital signs
        </span>
      </div>
    </motion.div>
  );
}
