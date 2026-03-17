"use client";

import { useCockpit } from "../src/hooks/useCockpit";
import { SystemPulse } from "../src/components/SystemPulse";
import { DecisionQueue } from "../src/components/DecisionQueue";
import { FrictionFeed } from "../src/components/FrictionFeed";
import { AutonomyControl } from "../src/components/AutonomyControl";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Ambient glow — responds to decision urgency
// ---------------------------------------------------------------------------

function AmbientGlow({ hasUrgent }: { hasUrgent: boolean }) {
  const color = hasUrgent
    ? "rgba(248, 113, 113, 0.04)"
    : "rgba(52, 211, 153, 0.03)";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hasUrgent ? "urgent" : "calm"}
        className="fixed inset-0 pointer-events-none z-[-1]"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          background: [
            `radial-gradient(ellipse 70% 50% at 50% 15%, ${color}, transparent)`,
            `radial-gradient(ellipse 80% 60% at 50% 20%, ${color}, transparent)`,
            `radial-gradient(ellipse 70% 50% at 50% 15%, ${color}, transparent)`,
          ],
        }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.6, ease: "easeOut" },
          background: { duration: 10, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Cockpit Page
// ---------------------------------------------------------------------------

export default function CockpitPage() {
  const { state, overrideDecision, reprioritize, adjustAutonomy } = useCockpit();
  const [autoCommitEnabled, setAutoCommitEnabled] = useState(
    state.autonomy.autoCommitEnabled
  );
  const [consolidationSpeed, setConsolidationSpeed] = useState(
    state.autonomy.consolidationSpeed
  );

  // Check if any decision has <15s consolidation remaining
  const hasUrgent = state.decisions.some(
    (d) => d.status === "consolidating" && d.consolidationTimer <= 15
  );

  return (
    <>
      <AmbientGlow hasUrgent={hasUrgent} />

      <main className="relative min-h-screen flex flex-col">
        {/* ─── Header ─── */}
        <motion.header
          className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Title row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-6 sm:w-8 bg-gradient-to-r from-transparent to-white/10" />
                <h1 className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-white/50">
                  THE MESH
                </h1>
                <div className="h-px w-6 sm:w-8 bg-gradient-to-l from-transparent to-white/10" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-white/15 tracking-[0.4em] uppercase font-mono">
                Control Surface
              </p>
            </div>

            {/* Vital signs strip */}
            <SystemPulse systems={state.systems} />
          </div>
        </motion.header>

        {/* ─── Content grid ─── */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
              {/* Left column — Decision Queue (wider) */}
              <motion.div
                className="lg:col-span-7 xl:col-span-7"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <DecisionQueue
                  decisions={state.decisions}
                  onOverride={overrideDecision}
                  onReprioritize={reprioritize}
                />
              </motion.div>

              {/* Right column — Friction Feed + Autonomy */}
              <motion.div
                className="lg:col-span-5 xl:col-span-5 flex flex-col gap-5 lg:gap-6"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.25,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {/* Friction Feed */}
                <FrictionFeed entries={state.frictionFeed} />

                {/* Autonomy Control */}
                <AutonomyControl
                  autonomy={{
                    ...state.autonomy,
                    autoCommitEnabled,
                    consolidationSpeed,
                  }}
                  onAdjustCeiling={adjustAutonomy}
                  onToggleAutoCommit={() =>
                    setAutoCommitEnabled((prev) => !prev)
                  }
                  onSetSpeed={setConsolidationSpeed}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <motion.footer
          className="mt-auto px-4 py-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/[0.04]" />
            <div className="w-1 h-1 rounded-full bg-white/[0.06]" />
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/[0.04]" />
          </div>
          <p className="text-[10px] text-white/[0.12] font-mono tabular tracking-wide">
            Friction is the signal. Override is the steering wheel.
          </p>
        </motion.footer>
      </main>
    </>
  );
}
