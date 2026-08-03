"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { EASE } from "@/lib/motion"
import { Wordmark } from "@/components/Wordmark"
import {
  REVEAL_ORDER,
  REVEAL_MS,
  nextPhase,
  type RevealPhase,
  type FinancialDna,
} from "@/lib/reveal"

// The signature onboarding reveal. Plays once, full-bleed over obsidian, the
// first time a wallet resolves on Arc. Sequence (all timing from lib/reveal, all
// easing from lib/motion — one motion system): fade to obsidian, hold, draw one
// thin champagne line, resolve the Financial DNA, reveal the score, reveal the
// one insight, then hand off to the dashboard. No spinner, no progress bar — the
// stillness is the point. Reduced-motion callers skip this entirely and mount
// the dashboard directly; this component assumes full motion.

const IDX = (p: RevealPhase) => REVEAL_ORDER.indexOf(p)

export function DnaReveal({ dna, onComplete }: { dna: FinancialDna; onComplete: () => void }) {
  const [phase, setPhase] = React.useState<RevealPhase>("hold")
  // Fire onComplete exactly once, even if effects re-run.
  const done = React.useRef(false)

  // Advance through the sequence on the shared timeline. Each phase dwells for
  // REVEAL_MS[phase], then steps to the next; reaching the terminal phase hands
  // control to the dashboard.
  React.useEffect(() => {
    const next = nextPhase(phase)
    if (next === null) {
      if (!done.current) {
        done.current = true
        onComplete()
      }
      return
    }
    const id = window.setTimeout(() => setPhase(next), REVEAL_MS[phase])
    return () => window.clearTimeout(id)
  }, [phase, onComplete])

  const i = IDX(phase)
  const showLine = i >= IDX("line")
  const showDna = i >= IDX("dna")
  const showScore = i >= IDX("score")
  const showInsight = i >= IDX("insight")
  // The whole overlay fades out as the beat ends and the dashboard takes over.
  const leaving = i >= IDX("dashboard")

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-obsidian px-6 text-center"
    >
      {/* One thin champagne line — the single mark on the void. */}
      <motion.div
        aria-hidden="true"
        className="h-px w-40 origin-center bg-gradient-to-r from-transparent via-champagne to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={showLine ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      />

      {/* Financial DNA — the wallet's real strand, resolving above the score. */}
      <motion.p
        className="eyebrow mt-8 !text-[10px]"
        initial={{ opacity: 0, y: 8 }}
        animate={showDna ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        Your Financial DNA
      </motion.p>
      <motion.div
        className="mt-2 font-mono text-xs tracking-[0.3em] text-silver"
        initial={{ opacity: 0 }}
        animate={showDna ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {dna.strand}
      </motion.div>

      {/* The score — the artifact, revealed first. */}
      <motion.div
        className="display mt-6 text-7xl leading-none text-ivory sm:text-8xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={showScore ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {dna.score}
      </motion.div>
      <motion.div
        className="mt-2 text-[10px] uppercase tracking-[0.3em] text-silver-dim"
        initial={{ opacity: 0 }}
        animate={showScore ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        of 1000
      </motion.div>

      {/* The one insight — revealed after the score. */}
      <motion.p
        className="mt-8 max-w-md text-lg font-medium leading-snug text-foreground"
        initial={{ opacity: 0, y: 12 }}
        animate={showInsight ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {dna.insight.headline}
      </motion.p>

      {/* Quiet signature at the foot of the void. */}
      <motion.div
        className="absolute bottom-10"
        initial={{ opacity: 0 }}
        animate={showDna ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <Wordmark className="display text-sm tracking-wide" />
      </motion.div>
    </motion.div>
  )
}
