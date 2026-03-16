"use client";

import { motion } from "framer-motion";
import type { MeshMessage, NodeRole } from "../lib/types";

const ROLE_COLOR: Record<NodeRole, string> = {
  adrian: "#a78bfa",
  kev: "#34d399",
  claude: "#60a5fa",
};

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function MessageStream({ messages }: { messages: MeshMessage[] }) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin">
      {messages.map((msg, i) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group flex gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
        >
          {/* Indicator dot */}
          <div className="mt-1.5 flex-shrink-0">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ROLE_COLOR[msg.from] }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: ROLE_COLOR[msg.from] }}
              >
                {msg.from}
              </span>
              <span className="text-[10px] text-white/25 tabular-nums">
                {timeAgo(msg.timestamp)}
              </span>
              {msg.type === "decision" && (
                <span className="text-[9px] uppercase tracking-widest text-amber-400/60 font-medium">
                  decision
                </span>
              )}
            </div>
            <p className="text-sm text-white/60 leading-relaxed mt-0.5">
              {msg.content}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
