"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { topSignals, type Signal } from "@/lib/insight"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// The "three things worth knowing" layer (File 06 dashboard hierarchy):
// Identity → Score → Companion → THESE → everything else. Each card is one
// distinct, plain-language reading of real on-chain data, ranked by relevance.
// Not metrics tiles — statements, set in the AETHER voice.

const TONE_DOT: Record<Signal["tone"], string> = {
  positive: "bg-positive",
  neutral: "bg-champagne",
  caution: "bg-caution",
}

export function TopSignals({ data, txs }: { data: WalletKundli; txs: ArcTx[] }) {
  const reduced = useReducedMotion()
  const signals = React.useMemo(() => topSignals(data, txs, 3), [data, txs])
  if (signals.length === 0) return null

  return (
    <section aria-label="What your wallet is telling you">
      <p className="eyebrow mb-4">Three things worth knowing</p>
      <div className="grid gap-4 md:grid-cols-3">
        {signals.map((s, i) => {
          const card = (
            <div className="card-primary group flex h-full flex-col p-6 transition-colors hover:border-hairline-strong">
              <div className="flex items-center gap-2">
                <span className={"h-1.5 w-1.5 rounded-full " + TONE_DOT[s.tone]} aria-hidden="true" />
                <span className="eyebrow !text-[10px]">{s.label}</span>
              </div>
              <p className="display mt-4 text-2xl leading-[1.05] text-ivory">{s.headline}</p>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-silver">{s.detail}</p>
              {s.action && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-champagne transition group-hover:gap-2">
                  {s.action.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
            </div>
          )
          return (
            <motion.div
              key={s.kind}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduced ? 0 : 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {s.action ? (
                <Link href={s.action.href} className="block h-full">
                  {card}
                </Link>
              ) : (
                card
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
