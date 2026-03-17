"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import type { AutonomyState } from "../lib/types";

// ---------------------------------------------------------------------------
// Gauge constants
// ---------------------------------------------------------------------------

const ARC_RADIUS = 88;
const ARC_STROKE = 6;
const ARC_CENTER_X = 110;
const ARC_CENTER_Y = 100;
const START_ANGLE = Math.PI; // 180 degrees (left)
const END_ANGLE = 0; // 0 degrees (right)

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  // For a semi-circle, sweep from left to right
  const largeArcFlag = startAngle - endAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// Full background arc path
const BG_ARC = describeArc(ARC_CENTER_X, ARC_CENTER_Y, ARC_RADIUS, START_ANGLE, END_ANGLE);

// Calculate total arc length for stroke-dasharray animation
const ARC_LENGTH = Math.PI * ARC_RADIUS;

// Color stops for gauge gradient
function gaugeColor(pct: number): string {
  if (pct <= 33) return "#34d399"; // green
  if (pct <= 66) return "#fbbf24"; // amber
  return "#f87171"; // red
}

function gaugeGlow(pct: number): string {
  if (pct <= 33) return "rgba(52, 211, 153, 0.35)";
  if (pct <= 66) return "rgba(251, 191, 36, 0.3)";
  return "rgba(248, 113, 113, 0.35)";
}

// ---------------------------------------------------------------------------
// SVG Arc Gauge
// ---------------------------------------------------------------------------

function ArcGauge({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  const motionPct = useMotionValue(value);
  const dashOffset = useTransform(motionPct, [0, 100], [ARC_LENGTH, 0]);

  // Animate on value change (not while dragging)
  useEffect(() => {
    if (!dragging) {
      animate(motionPct, value, {
        type: "spring",
        stiffness: 120,
        damping: 20,
      });
    }
  }, [value, dragging, motionPct]);

  const color = gaugeColor(value);
  const glow = gaugeGlow(value);

  // Interaction: click/drag on arc to set value
  const handlePointerEvent = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to SVG coordinates
      const svgX = (x / rect.width) * 220;
      const svgY = (y / rect.height) * 130;

      // Calculate angle from center
      const dx = svgX - ARC_CENTER_X;
      const dy = -(svgY - ARC_CENTER_Y); // flip Y
      const angle = Math.atan2(dy, dx);

      // Map angle to percentage: PI (left) = 0%, 0 (right) = 100%
      let pct = ((Math.PI - angle) / Math.PI) * 100;
      pct = Math.round(Math.max(0, Math.min(100, pct)));

      motionPct.set(pct);
      onChange(pct);
    },
    [onChange, motionPct],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => handlePointerEvent(e);
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, handlePointerEvent]);

  // Knob position
  const knobAngle = START_ANGLE - (value / 100) * Math.PI;
  const knob = polarToCartesian(ARC_CENTER_X, ARC_CENTER_Y, ARC_RADIUS, knobAngle);

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 220 130"
        className="w-full max-w-[280px] mx-auto cursor-pointer"
        onPointerDown={(e) => {
          setDragging(true);
          handlePointerEvent(e);
        }}
        style={{ touchAction: "none" }}
      >
        <defs>
          {/* Gradient for the filled arc */}
          <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const angle = START_ANGLE - (pct / 100) * Math.PI;
          const inner = polarToCartesian(ARC_CENTER_X, ARC_CENTER_Y, ARC_RADIUS - 12, angle);
          const outer = polarToCartesian(ARC_CENTER_X, ARC_CENTER_Y, ARC_RADIUS - 18, angle);
          return (
            <line
              key={pct}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          );
        })}

        {/* Background arc */}
        <path
          d={BG_ARC}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={ARC_STROKE}
          strokeLinecap="round"
        />

        {/* Filled arc with glow */}
        <motion.path
          d={BG_ARC}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={ARC_STROKE}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          style={{ strokeDashoffset: dashOffset }}
          filter="url(#gauge-glow)"
        />

        {/* Filled arc (crisp, on top) */}
        <motion.path
          d={BG_ARC}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={ARC_STROKE - 1}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          style={{ strokeDashoffset: dashOffset }}
        />

        {/* Knob */}
        <motion.circle
          cx={knob.x}
          cy={knob.y}
          r={dragging ? 7 : hovering ? 6 : 5}
          fill={color}
          stroke="rgba(5,5,7,0.6)"
          strokeWidth="2"
          style={{
            filter: `drop-shadow(0 0 6px ${glow})`,
          }}
          animate={{
            r: dragging ? 8 : hovering ? 6.5 : 5.5,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </svg>

      {/* Center value display */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
        <motion.span
          className="text-4xl font-mono tabular font-light leading-none"
          style={{ color }}
          key={value}
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {value}
        </motion.span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-mono mt-1.5">
          Autonomy Ceiling
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Override dots (depleting)
// ---------------------------------------------------------------------------

function OverrideDots({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/25 font-mono tabular">
        {remaining} override{remaining !== 1 ? "s" : ""} remaining
      </span>
      <div className="flex gap-1.5 ml-1">
        {Array.from({ length: total }).map((_, i) => {
          const active = i < remaining;
          return (
            <motion.div
              key={i}
              className="w-[6px] h-[6px] rounded-full"
              style={{
                background: active
                  ? "rgba(248, 113, 113, 0.7)"
                  : "rgba(255,255,255,0.06)",
                boxShadow: active
                  ? "0 0 6px rgba(248, 113, 113, 0.3)"
                  : "none",
              }}
              initial={false}
              animate={{
                scale: active ? 1 : 0.7,
                opacity: active ? 1 : 0.4,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom toggle switch
// ---------------------------------------------------------------------------

function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-white/35 font-mono tracking-wide">
        {label}
      </span>
      <button
        onClick={onToggle}
        className="relative w-10 h-[22px] rounded-full cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/20"
        style={{
          background: enabled
            ? "rgba(52, 211, 153, 0.15)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${enabled ? "rgba(52, 211, 153, 0.2)" : "rgba(255,255,255,0.06)"}`,
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <motion.div
          className="absolute top-[3px] w-[14px] h-[14px] rounded-full"
          style={{
            background: enabled ? "#34d399" : "rgba(255,255,255,0.2)",
            boxShadow: enabled
              ? "0 0 8px rgba(52, 211, 153, 0.4)"
              : "none",
          }}
          animate={{
            left: enabled ? 22 : 3,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented speed control
// ---------------------------------------------------------------------------

function SpeedSelector({
  value,
  onChange,
}: {
  value: "slow" | "normal" | "fast";
  onChange: (v: "slow" | "normal" | "fast") => void;
}) {
  const options = ["slow", "normal", "fast"] as const;
  const activeIndex = options.indexOf(value);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-white/35 font-mono tracking-wide">
        Consolidation Speed
      </span>
      <div
        className="relative flex rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Sliding indicator */}
        <motion.div
          className="absolute inset-y-0 rounded-xl"
          style={{
            width: `${100 / 3}%`,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
          animate={{
            left: `${(activeIndex / 3) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />

        {/* Buttons */}
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className="relative z-10 flex-1 py-2 text-[10px] uppercase tracking-[0.15em] font-mono cursor-pointer transition-colors duration-200 outline-none"
              style={{
                color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                background: "transparent",
                border: "none",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutonomyControl
// ---------------------------------------------------------------------------

export interface AutonomyControlProps {
  autonomy: AutonomyState;
  onAdjustCeiling: (ceiling: number) => void;
  onToggleAutoCommit: () => void;
  onSetSpeed: (speed: "slow" | "normal" | "fast") => void;
}

export function AutonomyControl({
  autonomy,
  onAdjustCeiling,
  onToggleAutoCommit,
  onSetSpeed,
}: AutonomyControlProps) {
  // Determine max overrides for dot display
  const maxOverrides = useMemo(
    () => Math.max(autonomy.overridesRemaining, 5),
    [autonomy.overridesRemaining],
  );

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-white/8" />
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-mono">
            Autonomy Control
          </h2>
        </div>
      </div>

      <div
        className="h-px mx-4"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        }}
      />

      {/* Gauge */}
      <div className="px-6 pt-6 pb-4">
        <ArcGauge value={autonomy.ceiling} onChange={onAdjustCeiling} />
      </div>

      {/* Controls */}
      <div className="px-6 pb-6 flex flex-col gap-5">
        {/* Override counter */}
        <OverrideDots remaining={autonomy.overridesRemaining} total={maxOverrides} />

        {/* Separator */}
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
          }}
        />

        {/* Auto-commit toggle */}
        <ToggleSwitch
          enabled={autonomy.autoCommitEnabled}
          onToggle={onToggleAutoCommit}
          label="Auto-commit"
        />

        {/* Consolidation speed */}
        <SpeedSelector
          value={autonomy.consolidationSpeed}
          onChange={onSetSpeed}
        />
      </div>
    </motion.div>
  );
}
