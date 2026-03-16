"use client";

import { motion } from "framer-motion";
import type { OrbitalNodeData } from "../lib/types";

const STATUS_RING: Record<string, string> = {
  active: "ring-2 ring-offset-2 ring-offset-black/50",
  thinking: "ring-2 ring-offset-2 ring-offset-black/50 animate-pulse",
  idle: "ring-1 ring-offset-1 ring-offset-black/30 opacity-70",
  offline: "ring-1 ring-offset-1 ring-offset-black/30 opacity-30",
};

export function OrbitalNode({ node }: { node: OrbitalNodeData }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: node.angle / 1000 }}
      className="absolute flex flex-col items-center gap-2"
      style={{
        left: `calc(50% + ${node.radius * Math.cos((node.angle * Math.PI) / 180)}%)`,
        top: `calc(50% + ${node.radius * Math.sin((node.angle * Math.PI) / 180)}%)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Glow backdrop */}
      <div
        className="absolute -inset-4 rounded-full blur-xl opacity-30"
        style={{ backgroundColor: node.color }}
      />

      {/* Node circle */}
      <div
        className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 backdrop-blur-md ${STATUS_RING[node.status]}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${node.color}40, ${node.color}15)`,
          boxShadow: `0 0 ${node.signal * 30}px ${node.color}50, inset 0 1px 0 rgba(255,255,255,0.1)`,
          // @ts-expect-error -- Tailwind ring-color via inline
          "--tw-ring-color": node.color,
        }}
      >
        <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
          {node.label.slice(0, 2)}
        </span>
      </div>

      {/* Label */}
      <span className="relative z-10 text-[11px] font-medium text-white/60 tracking-widest uppercase">
        {node.label}
      </span>

      {/* Signal bar */}
      <div className="relative z-10 h-0.5 w-10 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: node.color }}
          initial={{ width: 0 }}
          animate={{ width: `${node.signal * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
