"use client";

import { KillSwitch } from "../src/components/KillSwitch";
import { SYSTEMS } from "../src/lib/mock-data";
import { motion } from "framer-motion";

export default function CockpitPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8 flex flex-col items-center">
      {/* Header — barely there */}
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

      {/* The only thing on the page */}
      <KillSwitch systems={SYSTEMS} />

      {/* Footer timestamp */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-auto pt-16 pb-6"
      >
        <p className="text-[10px] text-white/10 font-mono tabular-nums text-center">
          Pulse fires on motion, not existence.
        </p>
      </motion.footer>
    </main>
  );
}
