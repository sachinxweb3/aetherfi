"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AuraCanvas } from "@/components/AuraCanvas"

// A wandering "lost aura" 404 — the orb drifts toward your cursor.
export default function NotFound() {
  const [seed, setSeed] = React.useState("0xlost404aura")
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aura-layer">
        <AuraCanvas address={seed} params={{ energy: 0.7, density: 0.5, pulse: 0.6, rings: 0.4 }} intense />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(5,6,15,0.8)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          className="grad-text text-8xl font-extrabold sm:text-9xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          404
        </motion.div>
        <div className="text-xl font-semibold">This aura drifted off-chain</div>
        <p className="max-w-sm text-muted">
          The page you seek isn&apos;t in this dimension. But your wallet&apos;s aura still glows —
          tap below to reshape reality.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            data-magnetic
            onClick={() => setSeed("0x" + Math.random().toString(16).slice(2))}
            className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold transition hover:border-accent/50"
          >
            🎲 Reshape the aura
          </button>
          <Link
            href="/"
            data-magnetic
            className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white"
          >
            Reveal My Aura →
          </Link>
        </div>
      </div>
    </div>
  )
}
