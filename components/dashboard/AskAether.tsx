"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowUpRight, CornerDownLeft } from "lucide-react"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { askAether, type AskAnswer } from "@/lib/askAether"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Wordmark } from "@/components/Wordmark"

// Dashboard-native "Ask AETHER" bar — natural-language questions answered
// instantly over the wallet data already in memory (File 06). Deterministic,
// no network round-trip, no paid model. The dashboard's conversational entry.

const SUGGESTIONS = [
  "What's my balance?",
  "How much have I spent?",
  "Why is my score that number?",
  "What's my streak?",
]

export function AskAether({ data, txs }: { data: WalletKundli; txs: ArcTx[] }) {
  const reduced = useReducedMotion()
  const [q, setQ] = React.useState("")
  const [answer, setAnswer] = React.useState<AskAnswer | null>(null)

  const ask = (question: string) => {
    const query = question.trim()
    if (!query) return
    setQ(query)
    setAnswer(askAether(data, txs, query))
  }

  return (
    <section className="card-primary p-6 sm:p-7">
      <p className="eyebrow flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-champagne" aria-hidden="true" /> The companion
      </p>
      <p className="display mt-3 text-2xl leading-tight text-ivory sm:text-3xl">Ask your wallet anything.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
        className="mt-5 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Where did my money go this week?"
            aria-label="Ask AetherFI a question about your wallet"
            className="w-full rounded-full border border-hairline bg-obsidian/40 py-3 pl-5 pr-10 text-sm text-foreground outline-none transition placeholder:text-silver-dim focus:border-champagne/40"
          />
          <CornerDownLeft className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-dim" aria-hidden="true" />
        </div>
        <button
          type="submit"
          className="btn-champagne shrink-0 px-6 py-3 text-sm disabled:opacity-50"
          disabled={!q.trim()}
        >
          Ask
        </button>
      </form>

      {/* Suggestion chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-hairline px-3 py-1 text-xs text-silver transition-colors hover:border-hairline-strong hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Answer */}
      <AnimatePresence mode="wait">
        {answer && (
          <motion.div
            key={answer.text}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 border-t border-hairline pt-5"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-silver-dim">
              <Sparkles className="h-3 w-3 text-champagne" aria-hidden="true" /> <Wordmark />
            </div>
            <p className="mt-2 text-base leading-relaxed text-foreground">{answer.text}</p>
            {answer.href && (
              <Link
                href={answer.href}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-champagne underline decoration-champagne/40 underline-offset-4 transition hover:decoration-champagne"
              >
                Open details <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
