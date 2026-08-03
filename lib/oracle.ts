import type { Holding } from "@/lib/arc"

// Isolated Oracle core — the price-feed analogue of lib/swap and lib/bridge.
// Pure adapter interface, an honest default feed, and a testable state-machine
// reducer. No React, no wallet, no network lives here.
//
// Arc Testnet tokens have no deployed price oracle (see lib/portfolio — we never
// fabricate a dollar value), so the default feed reports "unavailable" rather
// than inventing a price, source or confidence. A real oracle plugs into
// getOracle() with zero UI changes (File 16 honesty).

// Assets -----------------------------------------------------------------------

export interface OracleAsset { symbol: string; name: string; contract: string | null; decimals: number }

export function oracleAssetsFromHoldings(holdings: Holding[]): OracleAsset[] {
  return holdings.map((h) => ({ symbol: h.symbol, name: h.name, contract: h.contract, decimals: h.decimals }))
}
export function assetKey(a: OracleAsset): string {
  return a.contract ? a.contract.toLowerCase() : `native:${a.symbol.toLowerCase()}`
}
export function sameAsset(a: OracleAsset, b: OracleAsset): boolean {
  return assetKey(a) === assetKey(b)
}

// Price quotes -----------------------------------------------------------------
// Every field here originates from a real feed. The honest default produces
// NONE of these — the UI shows "—" for any asset without a live quote.

export interface PriceQuote {
  asset: OracleAsset
  priceUsd: number
  confidenceBps: number // reported uncertainty band, in basis points
  updatedAtMs: number // feed's own publish time
  feedId: string
  source: string
}

export type FeedOutcome =
  | { status: "ok"; quotes: PriceQuote[] }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

export interface Oracle {
  id: string
  label: string
  available: boolean
  read(assets: OracleAsset[]): Promise<FeedOutcome>
}

export const unavailableOracle: Oracle = {
  id: "none",
  label: "No price oracle connected",
  available: false,
  async read(): Promise<FeedOutcome> {
    return {
      status: "unavailable",
      message:
        "No price oracle is live on Arc Testnet yet. AetherFI will never invent a price, source or confidence — real feeds appear here the moment an oracle is connected.",
    }
  },
}

export function getOracle(): Oracle {
  return unavailableOracle
}

// Look up a real quote for an asset within an outcome, by key. Returns null
// when there is no live quote — the UI renders "—", never a fabricated number.
export function quoteFor(quotes: PriceQuote[] | null, asset: OracleAsset): PriceQuote | null {
  if (!quotes) return null
  return quotes.find((q) => sameAsset(q.asset, asset)) ?? null
}

// Formatting -------------------------------------------------------------------

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "—"
  const max = n !== 0 && Math.abs(n) < 1 ? 6 : 2
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: max })}`
}

export function fmtConfidence(bps: number): string {
  if (!Number.isFinite(bps)) return "—"
  return `±${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`
}

// Relative age of a feed timestamp against a caller-provided "now" (kept pure —
// the view passes Date.now()). Never invents freshness for a missing feed.
export function fmtAge(updatedAtMs: number, nowMs: number): string {
  const sec = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000))
  if (sec < 5) return "just now"
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

// Lifecycle state machine ------------------------------------------------------
// Mirrors lib/swap and lib/bridge. The Oracle only reads (no sign path), so the
// phases are: idle → reading → live | unavailable | error. Re-reading from
// `live`/`unavailable`/`error` is allowed; the reducer ignores a stale result
// that arrives outside the `reading` phase.

export type OraclePhase = "idle" | "reading" | "live" | "unavailable" | "error"

export interface OracleState {
  phase: OraclePhase
  quotes: PriceQuote[] | null
  message: string | null
}

export const initialOracleState: OracleState = { phase: "idle", quotes: null, message: null }

export type OracleEvent =
  | { type: "READ_REQUESTED" }
  | { type: "READ_RESULT"; outcome: FeedOutcome }
  | { type: "FAILED"; message: string }
  | { type: "RESET" }

export function oracleReducer(state: OracleState, event: OracleEvent): OracleState {
  switch (event.type) {
    case "READ_REQUESTED":
      return { phase: "reading", quotes: null, message: null }

    case "READ_RESULT":
      if (state.phase !== "reading") return state // ignore stale responses
      if (event.outcome.status === "ok")
        return { phase: "live", quotes: event.outcome.quotes, message: null }
      if (event.outcome.status === "unavailable")
        return { phase: "unavailable", quotes: null, message: event.outcome.message }
      return { phase: "error", quotes: null, message: event.outcome.message }

    case "FAILED":
      return { phase: "error", quotes: null, message: event.message }

    case "RESET":
      return initialOracleState

    default:
      return state
  }
}

export function isReading(phase: OraclePhase): boolean {
  return phase === "reading"
}
