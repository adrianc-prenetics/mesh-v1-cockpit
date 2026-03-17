"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { SystemPulse, PulseStatus } from "../lib/types";

// ---------------------------------------------------------------------------
// Pulse math
// ---------------------------------------------------------------------------

function getAge(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
}

function getStatus(pulse: SystemPulse): PulseStatus {
  const age = getAge(pulse.lastMotionAt);
  if (age >= pulse.thresholds.dead) return "dead";
  if (age >= pulse.thresholds.stale) return "stale";
  return "alive";
}

function formatAge(iso: string): { value: string; unit: string; raw: number } {
  const s = Math.floor(getAge(iso));
  if (s < 60) return { value: String(s), unit: "sec", raw: s };
  if (s < 3600) return { value: String(Math.floor(s / 60)), unit: "min", raw: s };
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return { value: `${h}:${String(m).padStart(2, "0")}`, unit: "hrs", raw: s };
  }
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return { value: `${d}d ${h}h`, unit: "", raw: s };
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<
  PulseStatus,
  { color: string; bg: string; glow: string; label: string; ringColor: string }
> = {
  alive: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.08)",
    glow: "0 0 20px rgba(52, 211, 153, 0.3)",
    label: "MOVING",
    ringColor: "rgba(52, 211, 153, 0.15)",
  },
  stale: {
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.06)",
    glow: "0 0 16px rgba(251, 191, 36, 0.2)",
    label: "STALE",
    ringColor: "rgba(251, 191, 36, 0.12)",
  },
  dead: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.06)",
    glow: "0 0 20px rgba(248, 113, 113, 0.3)",
    label: "DEAD",
    ringColor: "rgba(248, 113, 113, 0.15)",
  },
};

const UNWIRED = {
  color: "#3f3f46",
  bg: "rgba(63, 63, 70, 0.04)",
  glow: "none",
  label: "NOT WIRED",
  ringColor: "rgba(63, 63, 70, 0.08)",
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15 + i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ---------------------------------------------------------------------------
// Status Indicator (breathing organism, not a flat dot)
// ---------------------------------------------------------------------------

function StatusIndicator({
  status,
  color,
  glow,
}: {
  status: PulseStatus | "unwired";
  color: string;
  glow: string;
}) {
  const isAlive = status === "alive";
  const isDead = status === "dead";

  return (
    <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
      {/* Outer breathing ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${color}`, opacity: 0.15 }}
        animate={
          isAlive
            ? { scale: [1, 1.4, 1], opacity: [0.15, 0.05, 0.15] }
            : isDead
              ? { opacity: [0.15, 0.03, 0.15] }
              : {}
        }
        transition={{
          duration: isAlive ? 2.4 : 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 18,
          border: `1px solid ${color}`,
          opacity: 0.2,
        }}
        animate={
          isAlive
            ? { scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      {/* Core dot */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 8,
          height: 8,
          backgroundColor: color,
          boxShadow: glow,
        }}
        animate={
          isAlive
            ? { scale: [1, 1.25, 1], opacity: [0.9, 1, 0.9] }
            : isDead
              ? { opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }
              : {}
        }
        transition={{
          duration: isAlive ? 1.8 : 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pulse Row
// ---------------------------------------------------------------------------

function PulseRow({
  pulse,
  index,
  wired = true,
}: {
  pulse: SystemPulse;
  index: number;
  wired?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [age, setAge] = useState(formatAge(pulse.lastMotionAt));
  const status = wired ? getStatus(pulse) : ("unwired" as PulseStatus);
  const config = wired ? STATUS_MAP[status] : UNWIRED;

  useEffect(() => {
    if (!wired) return;
    const interval = setInterval(() => {
      setAge(formatAge(pulse.lastMotionAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [pulse.lastMotionAt, wired]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group"
    >
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left relative overflow-hidden rounded-xl p-[1px]"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.998 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Animated gradient border on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, transparent, ${config.color}15, transparent, ${config.color}08, transparent)`,
          }}
        />

        {/* Card interior */}
        <div
          className="relative rounded-xl px-4 py-4 sm:px-5 sm:py-5 flex items-center gap-3 sm:gap-4 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)`,
            borderLeft: `2px solid ${config.color}30`,
          }}
        >
          {/* Subtle status-colored glow on left edge */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full blur-sm"
            style={{ backgroundColor: config.color, opacity: 0.5 }}
          />

          {/* Status indicator */}
          <StatusIndicator status={status} color={config.color} glow={config.glow} />

          {/* System name */}
          <div className="flex flex-col min-w-0 flex-shrink-0 w-16 sm:w-20">
            <span className="text-[11px] sm:text-xs font-semibold text-white/60 tracking-[0.2em] uppercase truncate">
              {pulse.label}
            </span>
            <span
              className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] mt-0.5"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>

          {/* Age counter -- mission control readout */}
          <div className="flex-1 flex items-baseline justify-end gap-1.5 sm:gap-2 mr-1 sm:mr-2">
            {wired ? (
              <>
                <span
                  className="text-xl sm:text-2xl md:text-3xl font-mono font-bold tabular tracking-tight text-white/90"
                >
                  {age.value}
                </span>
                <span className="text-[10px] sm:text-xs text-white/25 font-mono uppercase tracking-wider">
                  {age.unit}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/15 font-sans ml-0.5">
                  ago
                </span>
              </>
            ) : (
              <span className="text-sm text-white/15 font-mono tracking-wider">
                ---
              </span>
            )}
          </div>

          {/* Expand chevron */}
          <motion.div
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md"
            style={{ background: "rgba(255,255,255,0.03)" }}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="text-white/25"
            >
              <path
                d="M2 3.5L5 6.5L8 3.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>
      </motion.button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 ml-[1px] border-l-2 border-white/[0.04]">
              <div className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: config.color, opacity: 0.5 }}
                />
                <div>
                  <p className="text-[13px] sm:text-sm text-white/45 leading-relaxed font-light">
                    {pulse.lastMotion}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-white/20 mt-2 font-mono tabular">
                    {new Date(pulse.lastMotionAt).toLocaleString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hero Pulse Organism
// ---------------------------------------------------------------------------

function HeroPulse({
  status,
  aliveCount,
  totalCount,
}: {
  status: PulseStatus;
  aliveCount: number;
  totalCount: number;
}) {
  const config = STATUS_MAP[status];

  const statusLabel =
    status === "alive"
      ? "All systems moving"
      : status === "stale"
        ? "Signal weakening"
        : "Systems down";

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* The organism */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-8">
        {/* Outermost ring - slow rotation */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${config.color}`,
            opacity: 0.06,
          }}
          animate={
            status === "alive"
              ? { rotate: 360, scale: [1, 1.04, 1] }
              : { opacity: [0.06, 0.02, 0.06] }
          }
          transition={
            status === "alive"
              ? {
                  rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {/* Ring 4 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "82%",
            height: "82%",
            border: `1px solid ${config.color}`,
            opacity: 0.08,
          }}
          animate={
            status === "alive"
              ? { scale: [1, 1.06, 1], opacity: [0.08, 0.04, 0.08] }
              : {}
          }
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />

        {/* Ring 3 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "64%",
            height: "64%",
            border: `1px solid ${config.color}`,
            opacity: 0.1,
          }}
          animate={
            status === "alive"
              ? { scale: [1, 1.08, 1], opacity: [0.1, 0.05, 0.1] }
              : status === "dead"
                ? { opacity: [0.1, 0.02, 0.1] }
                : {}
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Ring 2 */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "46%",
            height: "46%",
            border: `1px solid ${config.color}`,
            opacity: 0.15,
          }}
          animate={
            status === "alive"
              ? { scale: [1, 1.12, 1], opacity: [0.15, 0.08, 0.15] }
              : status === "dead"
                ? { opacity: [0.15, 0.03, 0.15], scale: [1, 0.95, 1] }
                : {}
          }
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "30%",
            height: "30%",
            border: `1.5px solid ${config.color}`,
            opacity: 0.2,
            boxShadow: `0 0 30px ${config.color}15, inset 0 0 20px ${config.color}10`,
          }}
          animate={
            status === "alive"
              ? {
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.35, 0.2],
                  boxShadow: [
                    `0 0 30px ${config.color}15, inset 0 0 20px ${config.color}10`,
                    `0 0 50px ${config.color}25, inset 0 0 30px ${config.color}15`,
                    `0 0 30px ${config.color}15, inset 0 0 20px ${config.color}10`,
                  ],
                }
              : status === "dead"
                ? { opacity: [0.2, 0.05, 0.2] }
                : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core - the heartbeat */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: 16,
            height: 16,
            backgroundColor: config.color,
            boxShadow: `0 0 40px ${config.color}50, 0 0 80px ${config.color}20`,
          }}
          animate={
            status === "alive"
              ? {
                  scale: [1, 1.4, 1],
                  boxShadow: [
                    `0 0 40px ${config.color}50, 0 0 80px ${config.color}20`,
                    `0 0 60px ${config.color}70, 0 0 120px ${config.color}30`,
                    `0 0 40px ${config.color}50, 0 0 80px ${config.color}20`,
                  ],
                }
              : status === "dead"
                ? {
                    opacity: [1, 0.2, 1],
                    scale: [1, 0.7, 1],
                  }
                : {
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                  }
          }
          transition={{
            duration: status === "alive" ? 1.8 : 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Ripple waves (alive only) */}
        {status === "alive" && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: "30%",
                height: "30%",
                border: `1px solid ${config.color}`,
              }}
              animate={{ scale: [1, 3], opacity: [0.25, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: "30%",
                height: "30%",
                border: `1px solid ${config.color}`,
              }}
              animate={{ scale: [1, 3], opacity: [0.15, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 1.5,
              }}
            />
          </>
        )}

        {/* Glassmorphic container ring */}
        <div
          className="absolute inset-[-2px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, transparent 45%, ${config.color}03 100%)`,
          }}
        />
      </div>

      {/* Status text */}
      <motion.p
        className="text-xs sm:text-sm uppercase tracking-[0.35em] font-medium"
        style={{ color: config.color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {statusLabel}
      </motion.p>

      {/* Count badge */}
      <motion.div
        className="mt-3 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div
          className="px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono tabular"
          style={{
            background: `${config.color}08`,
            border: `1px solid ${config.color}15`,
            color: `${config.color}`,
          }}
        >
          {aliveCount}/{totalCount}
        </div>
        <span className="text-[10px] sm:text-[11px] text-white/20 font-mono">
          systems alive
        </span>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Kill Switch (exported)
// ---------------------------------------------------------------------------

export type SystemPulseWithWired = SystemPulse & { wired?: boolean };

function getOverallStatus(systems: SystemPulseWithWired[]): PulseStatus {
  const wired = systems.filter((s) => s.wired !== false);
  if (wired.length === 0) return "dead";
  const statuses = wired.map(getStatus);
  if (statuses.includes("dead")) return "dead";
  if (statuses.includes("stale")) return "stale";
  return "alive";
}

export function KillSwitch({
  systems,
}: {
  systems: SystemPulseWithWired[];
}) {
  const [, setTick] = useState(0);
  const overall = getOverallStatus(systems);

  // Force re-render every second for live age counters
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const wiredSystems = useMemo(
    () => systems.filter((s) => s.wired !== false),
    [systems]
  );
  const aliveCount = wiredSystems.filter(
    (s) => getStatus(s) === "alive"
  ).length;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Hero pulse */}
      <div className="mb-12 sm:mb-16">
        <HeroPulse
          status={overall}
          aliveCount={aliveCount}
          totalCount={wiredSystems.length}
        />
      </div>

      {/* Section divider */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <span className="text-[9px] sm:text-[10px] text-white/20 uppercase tracking-[0.4em] font-mono">
          Systems
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </motion.div>

      {/* System rows */}
      <div className="flex flex-col gap-2 sm:gap-2.5">
        {systems.map((pulse, i) => (
          <PulseRow
            key={pulse.id}
            pulse={pulse}
            index={i}
            wired={pulse.wired !== false}
          />
        ))}
      </div>
    </div>
  );
}
