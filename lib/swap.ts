import type { Holding } from "@/lib/arc"

// Swap — the isolated core for the AetherFI swap module. Everything the UI needs
// to reason about a swap lives here as PURE, testable logic: the router adapter
// interface, an honest "no router connected" default, input validation, slippage
// math, and a state-machine reducer that models the entire lifecycle. No React,
// no wallet, no network in this file.
//
// HONESTY (File 16): Arc Testnet has no DEX router deployed and its tokens have
// no price feed (see lib/portfolio.ts — we never invent a USD value). So the
// DEFAULT router reports routing as *unavailable* rather than fabricating a
// quote or a rate. When a real on-chain router is deployed, implement SwapRouter
// against it and return it from getSwapRouter() — the UI and this reducer do not
// change. AetherFI never signs for you: execution is a user-signed wallet action
// the component performs only after you review a real quote.

// A token that can sit on either side of a swap. `contract: null` = native USDC.
export interface SwapToken {
  symbol: string
  name: string
  contract: string | null
  decimals: number
}

// What the UI hands a router to ask for a quote. Amounts are human units.
export interface QuoteRequest {
  from: SwapToken
  to: SwapToken
  amountIn: number
  slippageBps: number
}

// A real, router-provided quote. Only ever constructed by a router that actually
// priced the swap on-chain — never synthesized by the UI.
export interface SwapQuote {
  from: SwapToken
  to: SwapToken
  amountIn: number
  amountOut: number
  rate: number // amountOut per 1 amountIn
  minReceived: number // amountOut after slippage tolerance
  slippageBps: number
  priceImpactBps: number | null
  routerId: string
  fetchedAtMs: number
}

// A quote request never throws to fabricate a result — it resolves to one of
// three honest outcomes the UI renders distinctly.
export type QuoteOutcome =
  | { status: "ok"; quote: SwapQuote }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

// The adapter boundary. A real router implements this against an on-chain DEX;
// the UI only ever talks to this interface, so nothing above it changes when a
// router is connected.
export interface SwapRouter {
  id: string
  label: string
  available: boolean
  quote(req: QuoteRequest): Promise<QuoteOutcome>
}

// The default router. No DEX is deployed on Arc Testnet yet, so this reports
// routing as unavailable — it NEVER returns a fabricated quote. Swapping the
// real router in later is a one-line change in getSwapRouter().
export const unavailableRouter: SwapRouter = {
  id: "none",
  label: "No router connected",
  available: false,
  async quote(): Promise<QuoteOutcome> {
    return {
      status: "unavailable",
      message:
        "No swap router is live on Arc Testnet yet. AetherFI will never invent a rate — real quotes appear here the moment a router is connected.",
    }
  },
}

// The single seam a real integration plugs into. Today it returns the honest
// default; a deployed Arc DEX router is wired here without touching the UI.
export function getSwapRouter(): SwapRouter {
  return unavailableRouter
}

// ── Tokens ───────────────────────────────────────────────────────────────────

// Derive the selectable swap tokens from the wallet's real holdings. Native USDC
// first (reusing the portfolio ordering intent), then held tokens. Pure — the
// component passes in whatever the portfolio API returned.
export function swapTokensFromHoldings(holdings: Holding[]): SwapToken[] {
  return holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    contract: h.contract,
    decimals: h.decimals,
  }))
}

// Stable identity for a token (contract when present, else the native symbol).
export function tokenKey(t: SwapToken): string {
  return t.contract ? t.contract.toLowerCase() : `native:${t.symbol.toLowerCase()}`
}

export function sameToken(a: SwapToken, b: SwapToken): boolean {
  return tokenKey(a) === tokenKey(b)
}

// ── Slippage ───────────────────────────────────────────────────────────────

// Allowed slippage tolerances, in basis points (0.1% / 0.5% / 1%).
export const SLIPPAGE_OPTIONS_BPS = [10, 50, 100] as const
export const DEFAULT_SLIPPAGE_BPS = 50

// Minimum received after applying a slippage tolerance to a quoted output.
// Pure and total: clamps bps to a sane range so a bad input can't produce a
// negative floor.
export function applySlippage(amountOut: number, slippageBps: number): number {
  if (!Number.isFinite(amountOut) || amountOut <= 0) return 0
  const bps = Math.max(0, Math.min(10_000, Math.round(slippageBps)))
  return amountOut * (1 - bps / 10_000)
}

// Format basis points as a percent label ("0.5%").
export function fmtSlippage(bps: number): string {
  return `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface SwapValidation {
  amountValid: boolean // positive, finite amount entered
  distinctTokens: boolean // from ≠ to
  withinBalance: boolean // amount ≤ available balance of the from-token
  ready: boolean // safe to request a quote
  reason: string | null // first human-readable problem, or null
}

// Validate the swap inputs before we ever ask a router for a quote. Balance is
// the spendable amount of the from-token (the component supplies it from real
// holdings). Never fabricates — an empty amount is simply "not ready", not an
// error.
export function validateSwap(
  amountIn: string,
  from: SwapToken | null,
  to: SwapToken | null,
  fromBalance: number,
): SwapValidation {
  const n = Number(amountIn)
  const amountValid = amountIn.trim().length > 0 && Number.isFinite(n) && n > 0
  const distinctTokens = !!from && !!to && !sameToken(from, to)
  const withinBalance = amountValid && Number.isFinite(fromBalance) && n <= fromBalance

  let reason: string | null = null
  if (!from || !to) reason = "Choose both tokens to swap."
  else if (!distinctTokens) reason = "Pick two different tokens."
  else if (amountIn.trim().length > 0 && !amountValid) reason = "Enter an amount greater than zero."
  else if (amountValid && !withinBalance) reason = `You only hold ${fromBalance} ${from.symbol}.`

  const ready = amountValid && distinctTokens && withinBalance
  return { amountValid, distinctTokens, withinBalance, ready, reason }
}

// PLACEHOLDER_MACHINE

// ── Lifecycle state machine ─────────────────────────────────────────────────
// The whole swap flow as a pure reducer so every transition is unit-tested and
// the component holds no branching logic of its own. Phases:
//   idle        — inputs incomplete or unchanged; nothing requested
//   quoting     — a router quote is in flight (real loading state, no spinner lie)
//   quoted      — a real quote is on screen, ready to review & sign
//   unavailable — the router honestly has no route/price (not an error)
//   signing     — the user is signing the swap in their own wallet
//   confirming  — submitted; awaiting on-chain confirmation
//   success     — confirmed
//   error       — a request/sign/confirm failure with a real message

export type SwapPhase =
  | "idle"
  | "quoting"
  | "quoted"
  | "unavailable"
  | "signing"
  | "confirming"
  | "success"
  | "error"

export interface SwapState {
  phase: SwapPhase
  quote: SwapQuote | null
  message: string | null // unavailable/error copy, or null
  txHash: string | null
}

export const initialSwapState: SwapState = {
  phase: "idle",
  quote: null,
  message: null,
  txHash: null,
}

export type SwapEvent =
  | { type: "INPUT_CHANGED" } // any token/amount edit invalidates a stale quote
  | { type: "QUOTE_REQUESTED" }
  | { type: "QUOTE_RESULT"; outcome: QuoteOutcome }
  | { type: "SIGN_STARTED" }
  | { type: "SUBMITTED"; txHash: string }
  | { type: "CONFIRMED" }
  | { type: "FAILED"; message: string }
  | { type: "RESET" }

// The single transition function. Unknown transitions are no-ops (return the
// same state) so the UI can fire events defensively without corrupting state.
export function swapReducer(state: SwapState, event: SwapEvent): SwapState {
  switch (event.type) {
    case "INPUT_CHANGED":
      // Editing inputs discards any prior quote/outcome and returns to idle,
      // unless a swap is already being signed/confirmed (locked).
      if (state.phase === "signing" || state.phase === "confirming") return state
      return initialSwapState

    case "QUOTE_REQUESTED":
      return { phase: "quoting", quote: null, message: null, txHash: null }

    case "QUOTE_RESULT":
      if (state.phase !== "quoting") return state // ignore stale responses
      if (event.outcome.status === "ok")
        return { phase: "quoted", quote: event.outcome.quote, message: null, txHash: null }
      if (event.outcome.status === "unavailable")
        return { phase: "unavailable", quote: null, message: event.outcome.message, txHash: null }
      return { phase: "error", quote: null, message: event.outcome.message, txHash: null }

    case "SIGN_STARTED":
      if (state.phase !== "quoted") return state // can only sign a real quote
      return { ...state, phase: "signing", message: null }

    case "SUBMITTED":
      if (state.phase !== "signing") return state
      return { ...state, phase: "confirming", txHash: event.txHash }

    case "CONFIRMED":
      if (state.phase !== "confirming") return state
      return { ...state, phase: "success" }

    case "FAILED":
      return { ...state, phase: "error", message: event.message }

    case "RESET":
      return initialSwapState

    default:
      return state
  }
}

// Convenience predicates the UI reads instead of re-deriving phase logic.
export function isBusy(phase: SwapPhase): boolean {
  return phase === "quoting" || phase === "signing" || phase === "confirming"
}
export function canSign(phase: SwapPhase): boolean {
  return phase === "quoted"
}
