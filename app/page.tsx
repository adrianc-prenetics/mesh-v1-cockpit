"use client";

import { useState, useEffect } from "react";
import { KillSwitch } from "../src/components/KillSwitch";
import type { SystemPulse } from "../src/lib/types";
import { motion } from "framer-motion";

export default function CockpitPage() {
  const [systems, setSystems] = useState<(SystemPulse & { wired?: boolean })[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string>("");

  const fetchPulse = async () => {
    try {
      const res = await fetch("/api/pulse", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSystems(data.systems);
      setLastFetch(data.asOf);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch pulse");
    }
  };

  useEffect(() => {
    fetchPulse();
    // Re-fetch every 30 seconds
    const interval = setInterval(fetchPulse, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen px-4 py-10 md:px-8 flex flex-col items-center">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-sm font-semibold tracking-[0.3em] uppercase text-white/60">
          THE MESH
        </h1>
        <p className="text-[10px] text-white/15 tracking-[0.4em] uppercase mt-1">
          Kill Switch
        </p>
      </motion.header>

      {/* Kill switch or loading state */}
      {error && (
        <div className="text-red-400/70 text-[11px] font-mono mb-4">
          Pulse fetch failed: {error}
        </div>
      )}

      {systems ? (
        <KillSwitch systems={systems} />
      ) : !error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[11px] text-white/30 uppercase tracking-widest"
        >
          Reading pulse...
        </motion.div>
      ) : null}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-auto pt-16 pb-6 text-center"
      >
        <p className="text-[10px] text-white/10 font-mono tabular-nums">
          Pulse fires on motion, not existence.
        </p>
        {lastFetch && (
          <p className="text-[9px] text-white/[0.06] font-mono tabular-nums mt-1">
            Last fetch: {new Date(lastFetch).toLocaleTimeString()}
          </p>
        )}
      </motion.footer>
    </main>
  );
}
