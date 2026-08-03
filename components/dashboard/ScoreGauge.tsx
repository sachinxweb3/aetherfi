"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Cinematic radial aura-score gauge — the dashboard's signature centerpiece.
// A 270° arc with a gradient stroke that sweeps to the wallet's real score.
// Original design language (not a copy): the score IS the aura, rendered as
// energy filling a ring. Reduced-motion → renders settled, no sweep.

const SIZE = 176
const STROKE = 12
const R = (SIZE - STROKE) / 2
const CX = SIZE / 2
const GAP = 90 // degrees of open gap at the bottom
const SWEEP = 360 - GAP // 270° of usable arc
const CIRC = 2 * Math.PI * R
const ARC_LEN = CIRC * (SWEEP / 360)

export function ScoreGauge({ score, rank }: { score: number; rank: string }) {
  const reduced = useReducedMotion()
  const pct = Math.max(0, Math.min(1, score / 1000))
  const dash = ARC_LEN * pct
  // Rotate so the gap sits centered at the bottom.
  const rotation = 90 + GAP / 2

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-0" role="img" aria-label={`Aura score ${score} of 1000, rank ${rank}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8975a" />
            <stop offset="55%" stopColor="#d8c08a" />
            <stop offset="100%" stopColor="#9fc1d6" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={CX} cy={CX} r={R} fill="none" stroke="rgba(238,232,216,0.06)" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={`${ARC_LEN} ${CIRC}`}
          transform={`rotate(${rotation} ${CX} ${CX})`}
        />
        {/* Value arc */}
        <motion.circle
          cx={CX} cy={CX} r={R} fill="none" stroke="url(#gaugeGrad)" strokeWidth={STROKE}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${CX} ${CX})`}
          strokeDasharray={`${dash} ${CIRC}`}
          initial={reduced ? false : { strokeDasharray: `0 ${CIRC}` }}
          animate={{ strokeDasharray: `${dash} ${CIRC}` }}
          transition={reduced ? { duration: 0 } : { duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 5px rgba(216,192,138,0.35))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="display text-5xl leading-none text-ivory"
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {score}
        </motion.span>
        <span className="mt-1.5 text-[10px] uppercase tracking-[0.3em] text-silver-dim">of 1000</span>
        <span className="mt-1.5 text-xs font-medium text-champagne">{rank}</span>
      </div>
    </div>
  )
}
