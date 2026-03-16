"use client";

import { OrbitalLayout } from "../src/components/OrbitalLayout";
import { MessageStream } from "../src/components/MessageStream";
import { DecisionQueue } from "../src/components/DecisionQueue";
import { SystemStatus } from "../src/components/SystemStatus";
import { NODES, MESSAGES, DECISIONS, METRICS } from "../src/lib/mock-data";
import { motion } from "framer-motion";

function GlassCard({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 ${className}`}
    >
      <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-4">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export default function CockpitPage() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline justify-between mb-10"
      >
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white/90">
            THE MESH
          </h1>
          <p className="text-[11px] text-white/25 tracking-widest uppercase mt-0.5">
            Decision Kernel v1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/30 font-mono">LIVE</span>
        </div>
      </motion.header>

      {/* Grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_auto]">
        {/* Orbital Hero */}
        <GlassCard title="Orbital Network" className="lg:row-span-2">
          <OrbitalLayout nodes={NODES} />
        </GlassCard>

        {/* Message Stream */}
        <GlassCard title="Message Stream">
          <MessageStream messages={MESSAGES} />
        </GlassCard>

        {/* Decision Queue */}
        <GlassCard title="Decision Queue">
          <DecisionQueue decisions={DECISIONS} />
        </GlassCard>
      </div>

      {/* System Status — full width below */}
      <div className="mt-5">
        <GlassCard title="System Status">
          <SystemStatus metrics={METRICS} />
        </GlassCard>
      </div>
    </main>
  );
}
