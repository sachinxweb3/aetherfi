// Signature onboarding reveal — the cinematic beat that plays once when a wallet
// first resolves on Arc, before the dashboard appears. This module is the pure,
// testable core: it owns the SEQUENCE (obsidian → hold → line → DNA → score →
// insight → dashboard) and the composition of the "Financial DNA" line from real
// wallet data. No React, no DOM, no timers here — the overlay component drives
// the clock and reads these values, so the choreography stays deterministic and
// unit-tested. All timing rides the one AETHER motion language (lib/motion.ts).

import { DUR } from "@/lib/motion"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { buildInsight, type Insight } from "@/lib/insight"

// The ordered phases of the reveal. `hold` is the obsidian dwell before the line
// appears; `dna` is the champagne line drawing in; then the score, then the one
// insight, then the dashboard is handed control under the same motion system.
export type RevealPhase = "hold" | "line" | "dna" | "score" | "insight" | "dashboard"

export const REVEAL_ORDER: RevealPhase[] = ["hold", "line", "dna", "score", "insight", "dashboard"]

// Per-phase dwell, in milliseconds. `hold` sits in the 700–1200ms window the
// brief asks for (obsidian, no spinner, no bar — just stillness). The rest are
// derived from the shared duration scale so the reveal breathes at the same
// cadence as every other AETHER entrance. `dashboard` is terminal (0 = the beat
// is over; the real page takes over with its own rise() motion).
export const REVEAL_MS: Record<RevealPhase, number> = {
  hold: 950, // within 700–1200ms
  line: Math.round(DUR.slow * 1000), // 900 — the champagne line draws across
  dna: Math.round(DUR.base * 1000), // 600 — "Financial DNA" resolves
  score: Math.round(DUR.slow * 1000), // 900 — the gauge sweeps and the number lands
  insight: Math.round(DUR.slow * 1000), // 900 — the one reading settles
  dashboard: 0,
}

// Total runtime of the reveal, in ms. Used by tests and by any caller that wants
// to reason about the beat as a whole.
export function revealDuration(): number {
  return REVEAL_ORDER.reduce((sum, p) => sum + REVEAL_MS[p], 0)
}

// The next phase in the sequence, or null when the reveal is complete. Pure so
// the overlay's advance logic is a table lookup, not ad-hoc branching.
export function nextPhase(current: RevealPhase): RevealPhase | null {
  const i = REVEAL_ORDER.indexOf(current)
  if (i < 0 || i >= REVEAL_ORDER.length - 1) return null
  return REVEAL_ORDER[i + 1]
}

// True once the dashboard should be visible under the phase. Everything up to and
// including `insight` is still the overlay; `dashboard` hands off.
export function isRevealDone(phase: RevealPhase): boolean {
  return phase === "dashboard"
}

// ── Financial DNA ────────────────────────────────────────────────────────────
// The "DNA" is not fabricated — it is the wallet's own real numbers, composed
// into the reveal's three beats: the score (the artifact), the standing (rank +
// percentile), and the single most relevant insight (the same deterministic
// engine the hero uses, so the reveal never says something the dashboard won't).

export interface FinancialDna {
  score: number
  rank: string
  percentile: number
  txCount: number
  // A short, honest strand — e.g. "STEWARD · 742 · TOP 20%". Uppercased so it
  // reads as a signature line, not prose. Derived only from real fields.
  strand: string
  // The one thing worth knowing right now — reused from lib/insight so the
  // reveal and the settled hero speak with one voice.
  insight: Insight
}

// Compose the Financial DNA from a resolved kundli + its recent transactions.
// Pure and total: given the same wallet data it always yields the same DNA.
export function financialDna(k: WalletKundli, txs: ArcTx[]): FinancialDna {
  const top = Math.max(1, 100 - k.percentile)
  const strand = `${k.rank} · ${k.score} · TOP ${top}%`.toUpperCase()
  return {
    score: k.score,
    rank: k.rank,
    percentile: k.percentile,
    txCount: k.txCount,
    strand,
    insight: buildInsight(k, txs),
  }
}

// ── Once-per-session gating ──────────────────────────────────────────────────
// The reveal is a signature ONBOARDING beat: it should play the first time a
// wallet resolves this session, not on every auto-refresh or every return to the
// dashboard. We remember per-address in sessionStorage so it replays for a
// different wallet and after a fresh tab, but never interrupts a working session.
// SSR-safe: on the server (no window) we report "seen" so nothing renders during
// prerender, and the client effect re-decides on mount.

const SEEN_PREFIX = "af_reveal_seen_"

export function revealSeenThisSession(address: string): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.sessionStorage.getItem(SEEN_PREFIX + address.toLowerCase()) === "1"
  } catch {
    return true
  }
}

export function markRevealSeen(address: string): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(SEEN_PREFIX + address.toLowerCase(), "1")
  } catch {
    /* private mode / storage disabled — degrade to no reveal, never throw */
  }
}
