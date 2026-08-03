"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Dices } from "lucide-react"
import { AuraCanvas } from "@/components/AuraCanvas"
import { AuraBoundary } from "@/components/AuraBoundary"

// A wandering "lost aura" 404 — the orb drifts toward your cursor.
export default function NotFound() {
  const [seed, setSeed] = React.useState("0xlost404aura")
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aura-layer">
        <AuraBoundary>
          <AuraCanvas address={seed} params={{ energy: 0.7, density: 0.5, pulse: 0.6, rings: 0.4 }} intense />
        </AuraBoundary>
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(10,10,11,0.8)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          className="champagne-sheen text-8xl font-extrabold sm:text-9xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          404
        </motion.div>
        <div className="text-xl font-semibold">This aura drifted off-chain</div>
        <p className="max-w-sm text-silver-dim">
          The page you seek isn&apos;t in this dimension. Your wallet&apos;s aura still glows.
          Tap below to reshape it.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            data-magnetic
            onClick={() => setSeed("0x" + Math.random().toString(16).slice(2))}
            className="btn-ghost inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold"
          >
            <Dices className="h-4 w-4" aria-hidden="true" /> Reshape the aura
          </button>
          <Link
            href="/"
            data-magnetic
            className="btn-champagne rounded-full px-6 py-2.5 text-sm font-semibold"
          >
            Reveal my aura →
          </Link>
        </div>
      </div>
    </div>
  )
}
