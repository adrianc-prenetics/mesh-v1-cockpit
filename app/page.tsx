"use client";

import { useState, useEffect, useCallback } from "react";
import { KillSwitch } from "../src/components/KillSwitch";
import type { SystemPulse } from "../src/lib/types";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Ambient background that responds to system status
// ---------------------------------------------------------------------------

function AmbientGlow({ status }: { status: "alive" | "stale" | "dead" | "loading" }) {
  const colorMap = {
    alive: "rgba(52, 211, 153, 0.06)",
    stale: "rgba(251, 191, 36, 0.04)",
    dead: "rgba(248, 113, 113, 0.05)",
    loading: "rgba(255, 255, 255, 0.02)",
  };

  const color = colorMap[status];

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[-1]"
      animate={{
        background: [
          `radial-gradient(ellipse 70% 50% at 50% 20%, ${color}, transparent)`,
          `radial-gradient(ellipse 80% 60% at 50% 25%, ${color}, transparent)`,
          `radial-gradient(ellipse 70% 50% at 50% 20%, ${color}, transparent)`,
        ],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Hero placeholder */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-8 flex items-center justify-center">
        {[100, 82, 64, 46, 30].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-white/[0.04]"
            style={{ width: `${size}%`, height: `${size}%` }}
            animate={{ opacity: [0.04, 0.08, 0.04] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
        <motion.div
          className="w-4 h-4 rounded-full bg-white/10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.p
        className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-mono mb-12"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Reading pulse...
      </motion.p>

      {/* Card skeletons */}
      <div className="w-full flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-[72px] rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: [0.3, 0.6, 0.3], y: 0 }}
            transition={{
              opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 },
              y: { duration: 0.4, delay: i * 0.06 },
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      className="w-full max-w-xl mx-auto flex flex-col items-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Error pulse */}
      <div className="relative w-20 h-20 flex items-center justify-center mb-6">
        <motion.div
          className="absolute inset-0 rounded-full border border-red-400/10"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.05, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-3 h-3 rounded-full bg-red-400/60"
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-2">
        Pulse fetch failed
      </p>
      <p className="text-[11px] text-red-400/50 font-mono mb-6">{message}</p>

      <motion.button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg text-[11px] text-white/50 uppercase tracking-[0.2em] font-mono transition-all hover:text-white/80"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.98 }}
      >
        Retry
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Cockpit Page
// ---------------------------------------------------------------------------

export default function CockpitPage() {
  const [systems, setSystems] = useState<
    (SystemPulse & { wired?: boolean })[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string>("");

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSystems(data.systems);
      setLastFetch(data.asOf);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch pulse";
      setError(msg);
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30_000);
    return () => clearInterval(interval);
  }, [fetchPulse]);

  // Determine overall status for ambient glow
  const overallStatus = (() => {
    if (!systems) return "loading" as const;
    const wired = systems.filter((s) => s.wired !== false);
    if (wired.length === 0) return "dead" as const;
    const ages = wired.map((s) => {
      const age = (Date.now() - new Date(s.lastMotionAt).getTime()) / 1000;
      if (age >= s.thresholds.dead) return "dead";
      if (age >= s.thresholds.stale) return "stale";
      return "alive";
    });
    if (ages.includes("dead")) return "dead" as const;
    if (ages.includes("stale")) return "stale" as const;
    return "alive" as const;
  })();

  return (
    <>
      <AmbientGlow status={overallStatus} />

      <main className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 flex flex-col items-center">
        {/* Header */}
        <motion.header
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <div className="h-px w-6 sm:w-8 bg-gradient-to-r from-transparent to-white/10" />
            <h1 className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-white/50">
              THE MESH
            </h1>
            <div className="h-px w-6 sm:w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <p className="text-[9px] sm:text-[10px] text-white/15 tracking-[0.5em] uppercase font-mono">
            Kill Switch
          </p>
        </motion.header>

        {/* Content */}
        <div className="w-full flex-1 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {error && !systems ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorDisplay message={error} onRetry={fetchPulse} />
              </motion.div>
            ) : systems ? (
              <motion.div
                key="killswitch"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Show error banner if fetch fails but we have stale data */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="max-w-xl mx-auto mb-4"
                    >
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-amber-400/50 bg-amber-400/[0.04] border border-amber-400/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 flex-shrink-0" />
                        Stale data -- last fetch failed
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <KillSwitch systems={systems} />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <LoadingSkeleton />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.footer
          className="mt-auto pt-16 sm:pt-20 pb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/[0.04]" />
            <div className="w-1 h-1 rounded-full bg-white/[0.06]" />
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/[0.04]" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/[0.12] font-mono tabular tracking-wide">
            Pulse fires on motion, not existence.
          </p>
          {lastFetch && (
            <p className="text-[9px] text-white/[0.06] font-mono tabular mt-2">
              {new Date(lastFetch).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </motion.footer>
      </main>
    </>
  );
}
