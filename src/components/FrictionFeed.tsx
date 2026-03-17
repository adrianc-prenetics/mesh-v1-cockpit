"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FrictionEntry, MeshEntity } from "../lib/types";

// ---------------------------------------------------------------------------
// Entity config
// ---------------------------------------------------------------------------

const ENTITY_CONFIG: Record<
  MeshEntity,
  { color: string; dotColor: string; label: string }
> = {
  claude: {
    color: "rgb(96, 165, 250)",
    dotColor: "rgba(96, 165, 250, 0.9)",
    label: "Claude",
  },
  kev: {
    color: "rgb(192, 132, 252)",
    dotColor: "rgba(192, 132, 252, 0.9)",
    label: "Kev",
  },
  adrian: {
    color: "rgb(251, 191, 36)",
    dotColor: "rgba(251, 191, 36, 0.9)",
    label: "Adrian",
  },
};

// ---------------------------------------------------------------------------
// Friction type config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  FrictionEntry["type"],
  { bg: string; text: string; border: string; label: string }
> = {
  insight: {
    bg: "rgba(52, 211, 153, 0.05)",
    text: "rgba(52, 211, 153, 0.65)",
    border: "rgba(52, 211, 153, 0.1)",
    label: "insight",
  },
  pushback: {
    bg: "rgba(248, 113, 113, 0.05)",
    text: "rgba(248, 113, 113, 0.65)",
    border: "rgba(248, 113, 113, 0.1)",
    label: "pushback",
  },
  resolution: {
    bg: "rgba(96, 165, 250, 0.05)",
    text: "rgba(96, 165, 250, 0.65)",
    border: "rgba(96, 165, 250, 0.1)",
    label: "resolution",
  },
  question: {
    bg: "rgba(251, 191, 36, 0.05)",
    text: "rgba(251, 191, 36, 0.65)",
    border: "rgba(251, 191, 36, 0.1)",
    label: "question",
  },
};

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// ---------------------------------------------------------------------------
// Individual entry row
// ---------------------------------------------------------------------------

function EntryRow({
  entry,
  isLast,
}: {
  entry: FrictionEntry;
  isLast: boolean;
}) {
  const entity = ENTITY_CONFIG[entry.from];
  const typeConfig = TYPE_CONFIG[entry.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative"
    >
      <div className="flex gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 hover:bg-white/[0.012]">
        {/* Timeline column */}
        <div className="flex flex-col items-center pt-1 flex-shrink-0 w-3">
          {/* Entity dot */}
          <div className="relative">
            <motion.div
              className="w-[7px] h-[7px] rounded-full"
              style={{
                background: entity.dotColor,
                boxShadow: `0 0 6px ${entity.dotColor}`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
              }}
            />
          </div>

          {/* Vertical connector */}
          {!isLast && (
            <div
              className="w-px flex-1 mt-1.5 min-h-[12px]"
              style={{
                background: `linear-gradient(to bottom, ${entity.color}12, transparent)`,
              }}
            />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 -mt-0.5">
          {/* Top line: entity + type + time */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] font-medium"
              style={{ color: entity.color }}
            >
              {entity.label}
            </span>

            {/* Type pill */}
            <span
              className="text-[8px] uppercase tracking-[0.12em] px-1.5 py-[1px] rounded font-mono leading-none"
              style={{
                background: typeConfig.bg,
                color: typeConfig.text,
                border: `1px solid ${typeConfig.border}`,
              }}
            >
              {typeConfig.label}
            </span>

            <div className="flex-1" />

            {/* Timestamp -- relative normally, absolute on hover */}
            <span className="text-[10px] font-mono text-white/15 tabular flex-shrink-0 min-w-[32px] text-right">
              <span className="group-hover:hidden">{relativeTime(entry.timestamp)}</span>
              <span className="hidden group-hover:inline text-white/25">
                {formatTimestamp(entry.timestamp)}
              </span>
            </span>
          </div>

          {/* Body */}
          <p className="text-[13px] text-white/65 leading-[1.55]">
            {entry.content}
          </p>

          {/* Decision link */}
          {entry.decisionId && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                className="text-white/15"
              >
                <path
                  d="M1 4h6M5 2l2 2-2 2"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] font-mono text-white/20 tracking-wide hover:text-white/35 transition-colors cursor-pointer">
                Decision #{entry.decisionId.slice(0, 8)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FrictionFeed
// ---------------------------------------------------------------------------

export interface FrictionFeedProps {
  entries: FrictionEntry[];
}

export function FrictionFeed({ entries }: FrictionFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(entries.length);
  const [showNewIndicator, setShowNewIndicator] = useState(false);

  // Auto-scroll and flash on new entry
  useEffect(() => {
    if (entries.length > prevCountRef.current) {
      setShowNewIndicator(true);
      const timeout = setTimeout(() => setShowNewIndicator(false), 1500);

      if (scrollRef.current) {
        const el = scrollRef.current;
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }

      prevCountRef.current = entries.length;
      return () => clearTimeout(timeout);
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top highlight line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="relative w-2 h-2">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "#34d399" }}
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.8, 0.15, 0.8],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "#34d399" }}
            />
          </div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-mono">
            Friction Feed
          </h2>
        </div>
        <span className="text-[10px] font-mono text-white/12 tabular">
          {entries.length}
        </span>
      </div>

      {/* Separator */}
      <div
        className="h-px mx-4"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        }}
      />

      {/* Scroll container */}
      <div className="relative flex-1 min-h-0">
        {/* Top gradient fade */}
        <div
          className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,5,7,0.8) 0%, rgba(5,5,7,0) 100%)",
          }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-6 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(5,5,7,0.5) 0%, rgba(5,5,7,0) 100%)",
          }}
        />

        <div
          ref={scrollRef}
          className="overflow-y-auto py-4 px-1"
          style={{
            maxHeight: "520px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.04) transparent",
          }}
        >
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isLast={i === entries.length - 1}
              />
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {entries.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full border border-white/[0.04] flex items-center justify-center mb-4">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-white/8"
                  animate={{ opacity: [0.08, 0.15, 0.08] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <p className="text-[10px] text-white/12 uppercase tracking-[0.2em] font-mono">
                Awaiting friction
              </p>
            </motion.div>
          )}
        </div>

        {/* New entry pulse */}
        <AnimatePresence>
          {showNewIndicator && (
            <motion.div
              className="absolute bottom-4 left-1/2 z-20 pointer-events-none"
              style={{ x: "-50%" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div
                className="px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.15em] font-mono"
                style={{
                  background: "rgba(52, 211, 153, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.12)",
                  color: "rgba(52, 211, 153, 0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                new friction
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
