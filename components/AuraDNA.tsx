"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { WalletKundli } from "@/lib/arc"
import { seedFromAddress } from "@/lib/aura"

/**
 * Aura DNA — a deterministic fingerprint strip forged from the wallet address.
 * Same wallet always draws the same helix, so it reads like a signature.
 */
export function AuraDNA({ data }: { data: WalletKundli }) {
  const [s0, s1, s2, s3] = seedFromAddress(data.address)
  const bars = 42
  const rungs = React.useMemo(() => {
    // Cheap deterministic pseudo-noise from the four seeds, no Math.random.
    const out: { h: number; hue: number }[] = []
    for (let i = 0; i < bars; i++) {
      const t = i / bars
      const n =
        Math.abs(Math.sin(t * 12.9898 + s0 * 78.233)) * 0.5 +
        Math.abs(Math.cos(t * 4.1414 + s1 * 21.7)) * 0.35 +
        s2 * 0.15
      const hue = 205 + ((s3 * 360 + i * 6) % 40)
      out.push({ h: 0.25 + (n % 1) * 0.75, hue })
    }
    return out
  }, [s0, s1, s2, s3])

  const code = data.address.slice(2, 10).toUpperCase()

  return (
    <div className="card-primary overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Aura DNA</div>
        <div className="font-mono text-xs text-champagne/80">SEQ-{code}</div>
      </div>
      <div className="flex h-24 items-center justify-between gap-[3px]">
        {rungs.map((r, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            style={{
              background: `linear-gradient(180deg, hsl(${r.hue} 55% 70%), hsl(${r.hue + 14} 45% 55%))`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: r.h, opacity: 0.9 }}
            transition={{ delay: i * 0.012, duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="mt-3 text-xs text-silver-dim">
        A one-of-a-kind genome, encoded from your wallet. It never changes.
      </div>
    </div>
  )
}
