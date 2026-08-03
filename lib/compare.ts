import type { WalletKundli } from "@/lib/arc"

// Isolated Compare core — the pure, testable logic behind the wallet comparison
// page. It reuses the EXISTING real wallet analysis (WalletKundli from lib/arc,
// the same artifact the aura, dashboard and Aura Battle use) and never invents a
// metric: every number here is copied straight from two real analyses. When a
// wallet's data cannot be loaded, the flow honestly reports unavailable rather
// than comparing against a fabricated zero. No React, no network lives here.

export const ADDR_RE = /^0x[a-fA-F0-9]{40}$/

export function isValidAddress(a: string): boolean {
  return ADDR_RE.test(a.trim())
}
export function normalizeAddress(a: string): string {
  return a.trim().toLowerCase()
}
export function sameAddress(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b)
}
export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

// Validate the pair before any analysis is requested. Never fabricates — an
// empty field is simply "not ready", not an error.
export interface PairValidation {
  ready: boolean
  reason: string | null
}
export function validatePair(a: string, b: string): PairValidation {
  const av = isValidAddress(a)
  const bv = isValidAddress(b)
  let reason: string | null = null
  if (!a.trim() || !b.trim()) reason = "Enter two wallet addresses."
  else if (!av || !bv) reason = "Enter two valid 0x… addresses."
  else if (sameAddress(a, b)) reason = "Enter two different wallets."
  const ready = av && bv && !sameAddress(a, b)
  return { ready, reason }
}

// ── Metrics ──────────────────────────────────────────────────────────────────
// Every comparison row maps to ONE real WalletKundli field. Higher is better for
// all of these (percentile is stored as a standing where larger = stronger, the
// same convention lib/reveal uses to derive "TOP X%").

export type Side = "a" | "b" | "tie"

export interface CompareMetric {
  key: string
  label: string
  a: number
  b: number
  displayA: string
  displayB: string
  winner: Side
  higherIsBetter: boolean
}

interface MetricDef {
  key: string
  label: string
  get: (k: WalletKundli) => number
  fmt: (n: number) => string
  higherIsBetter: boolean
}

const int = (n: number) => Math.round(n).toLocaleString("en-US")
const usd = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
const days = (n: number) => `${int(n)} ${n === 1 ? "day" : "days"}`
const standing = (n: number) => `Top ${Math.max(1, 100 - Math.round(n))}%`

const METRICS: MetricDef[] = [
  { key: "score", label: "Aura score", get: (k) => k.score, fmt: (n) => int(n), higherIsBetter: true },
  { key: "percentile", label: "Standing", get: (k) => k.percentile, fmt: standing, higherIsBetter: true },
  { key: "txCount", label: "Transactions", get: (k) => k.txCount, fmt: int, higherIsBetter: true },
  { key: "balanceUSDC", label: "USDC balance", get: (k) => k.balanceUSDC, fmt: usd, higherIsBetter: true },
  { key: "walletAgeDays", label: "Wallet age", get: (k) => k.walletAgeDays, fmt: days, higherIsBetter: true },
  { key: "gasUsed", label: "Gas used", get: (k) => k.gasUsed, fmt: int, higherIsBetter: true },
  { key: "tokenTransfers", label: "Token transfers", get: (k) => k.tokenTransfers, fmt: int, higherIsBetter: true },
]

function edge(a: number, b: number, higherIsBetter: boolean): Side {
  if (a === b) return "tie"
  const aBetter = higherIsBetter ? a > b : a < b
  return aBetter ? "a" : "b"
}

// ── Result ───────────────────────────────────────────────────────────────────

export interface CompareResult {
  a: WalletKundli
  b: WalletKundli
  metrics: CompareMetric[]
  winner: Side // decided by the canonical artifact — the aura score (same as Aura Battle)
  aEdges: number // how many metrics each side leads on (ties excluded)
  bEdges: number
  ties: number
}

// Compose the comparison from two REAL analyses. Pure and total: given the same
// two kundli it always yields the same result. Fabricates nothing.
export function buildComparison(a: WalletKundli, b: WalletKundli): CompareResult {
  let aEdges = 0
  let bEdges = 0
  let ties = 0

  const metrics: CompareMetric[] = METRICS.map((m) => {
    const av = m.get(a)
    const bv = m.get(b)
    const winner = edge(av, bv, m.higherIsBetter)
    if (winner === "a") aEdges++
    else if (winner === "b") bEdges++
    else ties++
    return {
      key: m.key,
      label: m.label,
      a: av,
      b: bv,
      displayA: m.fmt(av),
      displayB: m.fmt(bv),
      winner,
      higherIsBetter: m.higherIsBetter,
    }
  })

  const winner: Side = a.score === b.score ? "tie" : a.score > b.score ? "a" : "b"
  return { a, b, metrics, winner, aEdges, bEdges, ties }
}

// PLACEHOLDER_MACHINE

// ── Lifecycle state machine ─────────────────────────────────────────────────
// Mirrors lib/swap, lib/bridge and lib/oracle. Compare only reads two analyses
// (no sign path), so the phases are: idle → loading → ready | unavailable |
// error. Editing an input returns to idle. `unavailable` is the honest state
// when a required wallet's data could not be loaded — never a fabricated
// comparison against a stand-in zero.

export type ComparePhase = "idle" | "loading" | "ready" | "unavailable" | "error"

export interface CompareState {
  phase: ComparePhase
  result: CompareResult | null
  message: string | null
}

export const initialCompareState: CompareState = { phase: "idle", result: null, message: null }

// The two analyses arriving from the loader. Either may be null when that
// wallet's data was unavailable (the API errored or returned nothing).
export type CompareOutcome =
  | { status: "ok"; a: WalletKundli; b: WalletKundli }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

export type CompareEvent =
  | { type: "INPUT_CHANGED" }
  | { type: "COMPARE_REQUESTED" }
  | { type: "COMPARE_RESULT"; outcome: CompareOutcome }
  | { type: "FAILED"; message: string }
  | { type: "RESET" }

export function compareReducer(state: CompareState, event: CompareEvent): CompareState {
  switch (event.type) {
    case "INPUT_CHANGED":
      if (state.phase === "idle") return state
      return initialCompareState

    case "COMPARE_REQUESTED":
      return { phase: "loading", result: null, message: null }

    case "COMPARE_RESULT":
      if (state.phase !== "loading") return state // ignore stale responses
      if (event.outcome.status === "ok")
        return { phase: "ready", result: buildComparison(event.outcome.a, event.outcome.b), message: null }
      if (event.outcome.status === "unavailable")
        return { phase: "unavailable", result: null, message: event.outcome.message }
      return { phase: "error", result: null, message: event.outcome.message }

    case "FAILED":
      return { phase: "error", result: null, message: event.message }

    case "RESET":
      return initialCompareState

    default:
      return state
  }
}

export function isLoading(phase: ComparePhase): boolean {
  return phase === "loading"
}
