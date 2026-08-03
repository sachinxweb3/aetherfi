import type { Holding } from "@/lib/arc"

// Pure, testable display helpers for the Portfolio module (File 04 balances,
// File 12 coverage). No React, no network.

// Format a token amount with sensible precision (more decimals for tiny amounts).
export function fmtAmount(n: number): string {
  if (!Number.isFinite(n)) return "0"
  if (n === 0) return "0"
  const max = n < 1 ? 6 : 4
  return n.toLocaleString("en-US", { maximumFractionDigits: max })
}

// Short A–Z avatar letters for a token with no logo.
export function tokenInitials(symbol: string): string {
  const s = (symbol || "?").replace(/[^a-zA-Z0-9]/g, "")
  return (s.slice(0, 2) || "?").toUpperCase()
}

// Holdings sorted for display: native USDC first, then by descending amount.
export function sortHoldings(holdings: Holding[]): Holding[] {
  return [...holdings].sort((a, b) => {
    if (a.isNative !== b.isNative) return a.isNative ? -1 : 1
    return b.amount - a.amount
  })
}

// Count of distinct assets actually held (amount > 0).
export function assetCount(holdings: Holding[]): number {
  return holdings.filter((h) => h.amount > 0).length
}

// A single row in the composition view: a held asset and its share of the
// total token amount. NOTE: shares are by TOKEN AMOUNT, not USD — Arc testnet
// tokens have no price feed, so we never fabricate a dollar value (File 16).
export interface AllocationRow {
  symbol: string
  name: string
  isNative: boolean
  amount: number
  share: number // 0..1 of summed token amount
  contract: string | null
}

// Allocation across held assets. Native USDC first, then descending amount
// (reuses sortHoldings). Zero-amount holdings are excluded; shares sum to ~1
// when anything is held, else all zero.
export function allocation(holdings: Holding[]): AllocationRow[] {
  const held = holdings.filter((h) => h.amount > 0)
  const total = held.reduce((sum, h) => sum + h.amount, 0)
  return sortHoldings(held).map((h) => ({
    symbol: h.symbol,
    name: h.name,
    isNative: h.isNative,
    amount: h.amount,
    share: total > 0 ? h.amount / total : 0,
    contract: h.contract,
  }))
}

// The largest single holding's share of total token amount (0..1) — a simple
// concentration signal for the composition insight line.
export function topShare(holdings: Holding[]): number {
  return allocation(holdings).reduce((max, r) => Math.max(max, r.share), 0)
}

// Format a 0..1 share as a percentage, with a floor label for dust so tiny
// positions never read as a flat "0%".
export function fmtShare(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return "0%"
  const pct = share * 100
  if (pct < 0.1) return "<0.1%"
  return pct.toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%"
}

// A compact, honest summary of a wallet's holdings — every field is derived
// from REAL balances (Holding[]), never a fabricated USD value. `nativeShare`
// is the native USDC slice of the total TOKEN AMOUNT (same convention as the
// composition bar), so it's comparable to the allocation rows and never claims
// a dollar figure Arc can't provide (File 16 honesty).
export interface PortfolioSummary {
  hasHoldings: boolean
  assetCount: number // distinct assets actually held (amount > 0)
  tokenCount: number // non-native assets held (ERC-20s)
  nativeUSDC: number // spendable native balance
  nativeShare: number // native amount / total token amount, 0..1
}

// Build the summary from real holdings. Pure and total: no holdings → all zero,
// hasHoldings false. Reuses allocation() so shares stay consistent with the
// composition view.
export function portfolioSummary(holdings: Holding[]): PortfolioSummary {
  const rows = allocation(holdings)
  const native = rows.find((r) => r.isNative)
  return {
    hasHoldings: rows.length > 0,
    assetCount: rows.length,
    tokenCount: rows.filter((r) => !r.isNative).length,
    nativeUSDC: native?.amount ?? 0,
    nativeShare: native?.share ?? 0,
  }
}

// A point-in-time snapshot of the native (spendable) USDC balance, persisted
// per address so we can show a REAL change since the user last looked.
export interface BalanceSnapshot {
  nativeUSDC: number
  at: number // epoch ms
}

export interface BalanceDelta {
  delta: number // current - previous, in USDC
  pct: number // percent change vs previous (0 when previous was 0)
  sinceMs: number // elapsed time since the snapshot
}

// Compare a stored snapshot against the current native balance. Returns null
// when there's no prior snapshot (first visit) so the UI shows nothing rather
// than inventing a trend (File 16 honesty).
export function balanceDelta(
  prev: BalanceSnapshot | null,
  current: number,
  nowMs: number
): BalanceDelta | null {
  if (!prev || !Number.isFinite(prev.nativeUSDC)) return null
  const delta = current - prev.nativeUSDC
  const pct = prev.nativeUSDC > 0 ? (delta / prev.nativeUSDC) * 100 : 0
  return { delta, pct, sinceMs: Math.max(0, nowMs - prev.at) }
}
