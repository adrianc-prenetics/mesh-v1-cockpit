"use client";

import { motion } from "framer-motion";
import type { SystemMetric } from "../lib/types";

const STATUS_COLOR: Record<string, string> = {
  nominal: "#34d399",
  warning: "#fbbf24",
  critical: "#f87171",
};

export function SystemStatus({ metrics }: { metrics: SystemMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => {
        const pct = (m.value / m.max) * 100;
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-sm"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
                {m.label}
              </span>
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[m.status] }}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-semibold text-white/90 tabular-nums">
                {m.value}
              </span>
              <span className="text-[10px] text-white/25">{m.unit}</span>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: STATUS_COLOR[m.status] }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
