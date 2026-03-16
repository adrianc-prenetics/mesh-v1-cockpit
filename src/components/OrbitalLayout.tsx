"use client";

import { OrbitalNode } from "./OrbitalNode";
import type { OrbitalNodeData } from "../lib/types";

export function OrbitalLayout({ nodes }: { nodes: OrbitalNodeData[] }) {
  return (
    <div className="relative aspect-square w-full max-w-[420px] mx-auto">
      {/* Orbital rings — pure CSS */}
      <div className="absolute inset-[12%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[24%] rounded-full border border-white/[0.04]" />

      {/* Center pulse */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-2 w-2 rounded-full bg-white/20 animate-ping" />
        <div className="absolute inset-0 h-2 w-2 rounded-full bg-white/40" />
      </div>

      {/* Orbital animation — rotating container, no SVG */}
      <div className="absolute inset-0 animate-orbit">
        {nodes.map((node) => (
          <OrbitalNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
