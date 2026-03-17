"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import type {
  Decision,
  DecisionStatus,
  DecisionPriority,
  MeshEntity,
  FrictionEntry,
} from "../lib/types";

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<DecisionPriority, string> = {
  critical: "#f87171",
  high: "#fbbf24",
  normal: "#60a5fa",
  low: "#3f3f46",
};

const ENTITY_CONFIG: Record<
  MeshEntity,
  { color: string; bg: string; label: string }
> = {
  claude: {
    color: "rgb(96, 165, 250)",
    bg: "rgba(96, 165, 250, 0.1)",
    label: "Claude",
  },
  kev: {
    color: "rgb(192, 132, 252)",
    bg: "rgba(192, 132, 252, 0.1)",
    label: "Kev",
  },
  adrian: {
    color: "rgb(251, 191, 36)",
    bg: "rgba(251, 191, 36, 0.1)",
    label: "Adrian",
  },
};

const STATUS_CONFIG: Record<
  DecisionStatus,
  { label: string; color: string; bg: string; border: string; pulseDot?: boolean }
> = {
  pending: {
    label: "Pending",
    color: "rgba(255,255,255,0.45)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
  },
  consolidating: {
    label: "Consolidating",
    color: "rgba(52, 211, 153, 0.75)",
    bg: "rgba(52, 211, 153, 0.06)",
    border: "rgba(52, 211, 153, 0.12)",
    pulseDot: true,
  },
  committed: {
    label: "Committed",
    color: "rgba(96, 165, 250, 0.55)",
    bg: "rgba(96, 165, 250, 0.04)",
    border: "rgba(96, 165, 250, 0.08)",
  },
  overridden: {
    label: "Overridden",
    color: "rgba(248, 113, 113, 0.65)",
    bg: "rgba(248, 113, 113, 0.05)",
    border: "rgba(248, 113, 113, 0.1)",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function timerColor(ratio: number): string {
  if (ratio > 0.5) return "#34d399";
  if (ratio > 0.2) return "#fbbf24";
  return "#f87171";
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: DecisionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[9px] uppercase tracking-[0.1em] font-mono flex-shrink-0"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.pulseDot ? (
        <motion.span
          className="w-[5px] h-[5px] rounded-full flex-shrink-0"
          style={{ background: cfg.color }}
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <span
          className="w-[5px] h-[5px] rounded-full flex-shrink-0"
          style={{ background: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Entity avatar -- small circle with initial
// ---------------------------------------------------------------------------

function EntityAvatar({ entity, size = 18 }: { entity: MeshEntity; size?: number }) {
  const cfg = ENTITY_CONFIG[entity];
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: cfg.bg,
        border: `1px solid ${cfg.color}20`,
      }}
    >
      <span
        className="font-medium uppercase leading-none"
        style={{ color: cfg.color, fontSize: size * 0.45 }}
      >
        {cfg.label[0]}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consolidation timer bar
// ---------------------------------------------------------------------------

function ConsolidationTimer({
  remaining,
  total,
  isActive,
}: {
  remaining: number;
  total: number;
  isActive: boolean;
}) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const color = timerColor(ratio);
  const progress = useMotionValue(ratio);
  const barWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    if (isActive) {
      animate(progress, ratio, {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      });
    } else {
      progress.set(ratio);
    }
  }, [ratio, isActive, progress]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[2px] rounded-full bg-white/[0.04] overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            width: barWidth,
            background: `linear-gradient(90deg, ${color}70, ${color})`,
          }}
        >
          {/* Glow on active */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 8px ${color}50, 0 0 2px ${color}80` }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>
      <span
        className="text-[11px] font-mono tabular min-w-[36px] text-right"
        style={{ color: `${color}80` }}
      >
        {Math.max(0, Math.ceil(remaining))}s
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Friction preview (last 1-2 inline)
// ---------------------------------------------------------------------------

function FrictionPreview({ entries }: { entries: FrictionEntry[] }) {
  const preview = entries.slice(-2);
  if (preview.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 mt-2.5">
      {preview.map((entry) => {
        const entity = ENTITY_CONFIG[entry.from];
        return (
          <div key={entry.id} className="flex items-start gap-2 min-w-0">
            <div
              className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[5px]"
              style={{ background: entity.color }}
            />
            <p className="text-[11px] text-white/30 leading-relaxed truncate">
              {entry.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full friction thread (expanded view)
// ---------------------------------------------------------------------------

function FrictionThread({ entries }: { entries: FrictionEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-[10px] text-white/12 font-mono uppercase tracking-[0.2em]">
          No friction recorded
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {entries.map((entry, i) => {
        const entity = ENTITY_CONFIG[entry.from];
        const typeColors: Record<string, string> = {
          insight: "rgba(52, 211, 153, 0.55)",
          pushback: "rgba(248, 113, 113, 0.55)",
          resolution: "rgba(96, 165, 250, 0.55)",
          question: "rgba(251, 191, 36, 0.55)",
        };

        return (
          <motion.div
            key={entry.id}
            className="flex gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.012] transition-colors duration-200"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.25,
              delay: i * 0.04,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div
              className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[6px]"
              style={{ background: entity.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: entity.color }}
                >
                  {entity.label}
                </span>
                <span
                  className="text-[8px] uppercase tracking-[0.1em] font-mono"
                  style={{ color: typeColors[entry.type] || "rgba(255,255,255,0.3)" }}
                >
                  {entry.type}
                </span>
                <span className="text-[9px] font-mono text-white/12 tabular ml-auto flex-shrink-0">
                  {relativeTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-[12px] text-white/50 leading-relaxed">
                {entry.content}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  index,
  onOverride,
}: {
  decision: Decision;
  index: number;
  onOverride: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prevStatus = useRef(decision.status);
  const [flash, setFlash] = useState(false);

  const priorityColor = PRIORITY_COLORS[decision.priority];
  const isConsolidating = decision.status === "consolidating";
  const isCommitted = decision.status === "committed";
  const isOverridden = decision.status === "overridden";

  // Detect status changes for flash effect
  useEffect(() => {
    if (prevStatus.current !== decision.status) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevStatus.current = decision.status;
      return () => clearTimeout(t);
    }
  }, [decision.status]);

  const borderStyle = isOverridden
    ? "rgba(248, 113, 113, 0.12)"
    : isConsolidating
    ? hovered
      ? "rgba(52, 211, 153, 0.15)"
      : "rgba(52, 211, 153, 0.06)"
    : hovered
    ? "rgba(255,255,255,0.1)"
    : "rgba(255,255,255,0.05)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{
        opacity: isCommitted ? 0.5 : 1,
        y: 0,
        filter: "blur(0px)",
      }}
      exit={{ opacity: 0, y: -12, filter: "blur(4px)", scale: 0.98 }}
      transition={{
        duration: 0.45,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
        layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      {/* Status change flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20"
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${STATUS_CONFIG[decision.status].color}25, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Consolidating border pulse */}
      {isConsolidating && (
        <motion.div
          className="absolute -inset-px rounded-2xl pointer-events-none z-0"
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(52, 211, 153, 0)",
              "0 0 0 1px rgba(52, 211, 153, 0.06)",
              "0 0 0 0px rgba(52, 211, 153, 0)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Card */}
      <motion.div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${borderStyle}`,
          transition: "border-color 0.3s ease",
        }}
        whileHover={{ scale: 1.004 }}
        whileTap={{ scale: 0.998 }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Priority edge -- thin vertical bar on left */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[2.5px] rounded-r-full"
          style={{
            background: `linear-gradient(to bottom, ${priorityColor}80, ${priorityColor}30)`,
          }}
        />

        <div className="pl-5 pr-4 py-4">
          {/* Row 1: Title + status badge */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[14px] font-medium text-white/85 leading-snug flex-1 min-w-0">
              {decision.title}
            </h3>
            <StatusBadge status={decision.status} />
          </div>

          {/* Row 2: Submitted by */}
          <div className="flex items-center gap-2 mb-3">
            <EntityAvatar entity={decision.submittedBy} />
            <span className="text-[11px] text-white/25">
              submitted by{" "}
              <span style={{ color: ENTITY_CONFIG[decision.submittedBy].color, opacity: 0.7 }}>
                {ENTITY_CONFIG[decision.submittedBy].label}
              </span>
            </span>
            <div className="flex-1" />
            <span className="text-[10px] font-mono text-white/12 tabular">
              {relativeTime(decision.submittedAt)}
            </span>
          </div>

          {/* Row 3: Consolidation timer */}
          {(isConsolidating || decision.status === "pending") &&
            decision.consolidationTotal > 0 && (
              <div className="mb-3">
                <ConsolidationTimer
                  remaining={decision.consolidationTimer}
                  total={decision.consolidationTotal}
                  isActive={isConsolidating}
                />
              </div>
            )}

          {/* Friction preview (collapsed) */}
          {!expanded && decision.friction.length > 0 && (
            <FrictionPreview entries={decision.friction} />
          )}

          {/* Tags */}
          {decision.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {decision.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase tracking-[0.08em] font-mono px-2 py-[2px] rounded text-white/20 bg-white/[0.025] border border-white/[0.04]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded friction thread */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/18 font-mono">
                      Friction Thread
                    </span>
                    <span className="text-[9px] font-mono text-white/8 tabular">
                      {decision.friction.length}
                    </span>
                  </div>
                  <FrictionThread entries={decision.friction} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Override button -- slides in from right */}
        <AnimatePresence>
          {isConsolidating && hovered && (
            <motion.div
              className="absolute right-4 top-1/2 z-10"
              style={{ y: "-50%" }}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onOverride(decision.id);
                }}
                className="relative px-4 py-2 rounded-xl text-[9px] font-mono uppercase cursor-pointer"
                style={{
                  letterSpacing: "0.25em",
                  background:
                    "linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(248, 113, 113, 0.03))",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(248, 113, 113, 0.18)",
                  color: "rgba(248, 113, 113, 0.8)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 4px 20px rgba(248, 113, 113, 0.1)",
                }}
                whileTap={{ scale: 0.96 }}
              >
                OVERRIDE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// DecisionQueue
// ---------------------------------------------------------------------------

export interface DecisionQueueProps {
  decisions: Decision[];
  onOverride: (id: string) => void;
  onReprioritize: (id: string, priority: DecisionPriority) => void;
}

export function DecisionQueue({
  decisions,
  onOverride,
}: DecisionQueueProps) {
  const sorted = useMemo(() => {
    const statusOrder: Record<DecisionStatus, number> = {
      consolidating: 0,
      pending: 1,
      committed: 2,
      overridden: 3,
    };
    const priorityOrder: Record<DecisionPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    return [...decisions].sort((a, b) => {
      const s = statusOrder[a.status] - statusOrder[b.status];
      if (s !== 0) return s;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [decisions]);

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-white/8" />
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-mono">
            Decision Queue
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/12 tabular">
          <span>
            {decisions.filter((d) => d.status === "consolidating").length} active
          </span>
          <div className="w-px h-3 bg-white/[0.05]" />
          <span>{decisions.length} total</span>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {sorted.map((decision, i) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              index={i}
              onOverride={onOverride}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {decisions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center py-20"
          >
            <div className="w-12 h-12 rounded-full border border-white/[0.04] flex items-center justify-center mb-4">
              <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
            </div>
            <p className="text-[10px] text-white/12 font-mono uppercase tracking-[0.2em]">
              Queue empty
            </p>
            <p className="text-[10px] text-white/6 font-mono mt-1">
              No decisions pending
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
