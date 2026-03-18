"use client";

import { useCockpit } from "../src/hooks/useCockpit";
import { SystemPulse } from "../src/components/SystemPulse";
import { DecisionQueue } from "../src/components/DecisionQueue";
import { FrictionFeed } from "../src/components/FrictionFeed";
import { AutonomyControl } from "../src/components/AutonomyControl";
import { KillSwitch } from "../src/components/KillSwitch";
import { ExecutionContext } from "../src/components/ExecutionContext";
import type { DecisionPriority } from "../src/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

type TabId = "dashboard" | "systems";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "systems", label: "Systems" },
];

// ---------------------------------------------------------------------------
// Ambient glow -- responds to decision urgency
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
// Connection Status Indicator
// ---------------------------------------------------------------------------

function ConnectionDot({
  status,
}: {
  status: "connecting" | "live" | "offline";
}) {
  const dotColor =
    status === "live"
      ? "bg-emerald-400/80"
      : status === "connecting"
        ? "bg-amber-400/80"
        : "bg-red-400/80";

  const label =
    status === "live"
      ? "Live"
      : status === "connecting"
        ? "Connecting"
        : "Offline";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Breathing ring */}
        {status !== "offline" && (
          <motion.div
            className={`absolute w-2.5 h-2.5 rounded-full ${dotColor} opacity-30`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{
              duration: status === "live" ? 3 : 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      </div>
      <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-white/25">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Bar
// ---------------------------------------------------------------------------

function TabBar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <nav className="flex items-center gap-6" role="tablist">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className="relative pb-2.5 outline-none group"
          >
            <span
              className={`text-[10px] font-mono tracking-[0.2em] uppercase transition-colors duration-300 ${
                isActive ? "text-white/60" : "text-white/20 group-hover:text-white/35"
              }`}
            >
              {tab.label}
            </span>

            {/* Animated underline */}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Cockpit Page
// ---------------------------------------------------------------------------

export default function CockpitPage() {
  const {
    state,
    overrideDecision,
    reprioritize,
    adjustAutonomy,
    pause,
    resume,
    toggleAutoCommit,
    setConsolidationSpeed,
    executionContext,
    pauseAck,
    connectionStatus,
  } = useCockpit();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Check if any decision has <15s consolidation remaining
  const hasUrgent = state.decisions.some(
    (d) => d.status === "consolidating" && d.consolidationTimer <= 15
  );

  // Systems from API already include wired flag; mock systems default to true
  const systemsForKillSwitch = state.systems.map((s) => ({
    ...s,
    wired: s.wired !== false,
  }));

  return (
    <>
      <AmbientGlow hasUrgent={hasUrgent} />

      <main className="relative min-h-screen flex flex-col">
        {/* ================================================================= */}
        {/*  Header                                                           */}
        {/* ================================================================= */}
        <motion.header
          className="relative z-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {/* Glassmorphic header bar */}
          <div
            className="border-b border-white/[0.04]"
            style={{
              background: "rgba(255,255,255,0.015)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Top row: title + tabs + connection */}
              <div className="flex items-center justify-between h-14 sm:h-16">
                {/* Left: Title */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="h-px w-5 sm:w-7 bg-gradient-to-r from-transparent to-white/10" />
                  <h1 className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-white/50">
                    THE MESH
                  </h1>
                  <div className="h-px w-5 sm:w-7 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                {/* Center: Tabs */}
                <div className="hidden sm:flex items-end h-full">
                  <TabBar active={activeTab} onSelect={setActiveTab} />
                </div>

                {/* Right: Connection */}
                <div className="shrink-0">
                  <ConnectionDot status={connectionStatus} />
                </div>
              </div>

              {/* Mobile tabs */}
              <div className="sm:hidden flex items-end pb-0">
                <TabBar active={activeTab} onSelect={setActiveTab} />
              </div>
            </div>
          </div>

          {/* SystemPulse strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
            <SystemPulse systems={state.systems} />
          </div>
        </motion.header>

        {/* ================================================================= */}
        {/*  Tab Content                                                      */}
        {/* ================================================================= */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {/* ── Execution Context (conditional, full width) ── */}
                  <AnimatePresence>
                    {executionContext &&
                      executionContext.status !== "complete" && (
                        <motion.div
                          className="mb-5 lg:mb-6"
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                        >
                          <ExecutionContext
                            context={executionContext}
                            pauseAck={pauseAck}
                            onPause={async () => {
                              if (executionContext?.taskId) {
                                await pause(executionContext.taskId);
                              }
                            }}
                            onResume={() => {
                              if (executionContext?.taskId) {
                                resume(executionContext.taskId);
                              }
                            }}
                          />
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {/* ── Two-column grid ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                    {/* Left column -- Decision Queue */}
                    <motion.div
                      className="lg:col-span-7"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.1,
                        ease: EASE,
                      }}
                    >
                      <DecisionQueue
                        decisions={state.decisions}
                        onOverride={overrideDecision}
                        onReprioritize={reprioritize}
                      />
                    </motion.div>

                    {/* Right column -- Friction Feed + Autonomy */}
                    <motion.div
                      className="lg:col-span-5 flex flex-col gap-5 lg:gap-6"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.2,
                        ease: EASE,
                      }}
                    >
                      <FrictionFeed entries={state.frictionFeed} />

                      <AutonomyControl
                        autonomy={state.autonomy}
                        onAdjustCeiling={adjustAutonomy}
                        onToggleAutoCommit={toggleAutoCommit}
                        onSetSpeed={setConsolidationSpeed}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="systems"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="pt-2"
                >
                  {/* ── Full-width KillSwitch ── */}
                  <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1,
                      ease: EASE,
                    }}
                  >
                    <KillSwitch systems={systemsForKillSwitch} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ================================================================= */}
        {/*  Footer                                                           */}
        {/* ================================================================= */}
        <motion.footer
          className="mt-auto px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Divider */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/[0.04]" />
              <div className="w-1 h-1 rounded-full bg-white/[0.06]" />
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/[0.04]" />
            </div>

            {/* Poetry line */}
            <p className="text-center text-[10px] text-white/[0.12] font-mono tracking-wide mb-1.5">
              Friction is the signal. Override is the steering wheel.
            </p>

            {/* Connection data source */}
            <p className="text-center text-[9px] font-mono tracking-[0.15em] text-white/[0.08]">
              {connectionStatus === "live"
                ? "Live data from GitHub + Vercel"
                : connectionStatus === "connecting"
                  ? "Establishing connection..."
                  : "Using cached data"}
            </p>
          </div>
        </motion.footer>
      </main>
    </>
  );
}
