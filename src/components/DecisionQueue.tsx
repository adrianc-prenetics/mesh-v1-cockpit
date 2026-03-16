"use client";

import { motion } from "framer-motion";
import type { Decision, NodeRole } from "../lib/types";

const ROLE_COLOR: Record<NodeRole, string> = {
  adrian: "#a78bfa",
  kev: "#34d399",
  claude: "#60a5fa",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  deferred: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

export function DecisionQueue({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="flex flex-col gap-2">
      {decisions.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 leading-snug">
                {d.title}
              </p>
              <p className="text-[11px] text-white/30 mt-1">
                by{" "}
                <span style={{ color: ROLE_COLOR[d.proposedBy] }}>
                  {d.proposedBy}
                </span>
              </p>
            </div>
            <span
              className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_BADGE[d.status]}`}
            >
              {d.status}
            </span>
          </div>

          {/* Vote indicators */}
          <div className="flex gap-1.5 mt-2.5">
            {(["adrian", "kev", "claude"] as NodeRole[]).map((role) => {
              const vote = d.votes[role];
              return (
                <div
                  key={role}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
                  style={{
                    backgroundColor: vote ? `${ROLE_COLOR[role]}15` : "transparent",
                  }}
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: vote ? ROLE_COLOR[role] : "rgba(255,255,255,0.1)",
                    }}
                  />
                  <span className="text-[10px] text-white/30">
                    {role.slice(0, 1).toUpperCase()}
                  </span>
                  {vote && (
                    <span className="text-[9px] text-white/20">
                      {vote === "approve" ? "✓" : vote === "reject" ? "✕" : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
