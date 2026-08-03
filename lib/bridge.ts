import type { Holding } from "@/lib/arc"

// Isolated Bridge core — the cross-chain analogue of lib/swap. Pure adapter
// interface, an honest default router, input validation, fee/receive math, and
// a testable state-machine reducer. No React, no wallet, no network lives here.
//
// No canonical bridge is deployed for Arc Testnet, so the default router
// reports "unavailable" rather than inventing a route, fee, or ETA. A real
// bridge plugs into getBridgeRouter() with zero UI changes (File 16 honesty).

// Chains -----------------------------------------------------------------------

export interface BridgeChain { id: number; name: string; short: string }

// Source is always Arc — the network AetherFI lives on.
export const ARC_CHAIN: BridgeChain = { id: 5042002, name: "Arc Testnet", short: "Arc" }

// Candidate destinations a future bridge could reach. Listing a chain is NOT a
// promise of a route: getBridgeRouter() decides availability, and today it
// honestly reports none. These are real public testnets, never fabricated.
export const BRIDGE_DESTINATIONS: BridgeChain[] = [
  { id: 11155111, name: "Ethereum Sepolia", short: "Sepolia" },
  { id: 84532, name: "Base Sepolia", short: "Base" },
  { id: 421614, name: "Arbitrum Sepolia", short: "Arbitrum" },
]
export const DEFAULT_DESTINATION_ID = BRIDGE_DESTINATIONS[0].id

export function chainById(id: number | null): BridgeChain | null {
  if (id === null) return null
  if (id === ARC_CHAIN.id) return ARC_CHAIN
  return BRIDGE_DESTINATIONS.find((c) => c.id === id) ?? null
}

// Assets -----------------------------------------------------------------------

export interface BridgeAsset { symbol: string; name: string; contract: string | null; decimals: number }

export function bridgeAssetsFromHoldings(holdings: Holding[]): BridgeAsset[] {
  return holdings.map((h) => ({ symbol: h.symbol, name: h.name, contract: h.contract, decimals: h.decimals }))
}
export function assetKey(a: BridgeAsset): string {
  return a.contract ? a.contract.toLowerCase() : `native:${a.symbol.toLowerCase()}`
}
export function sameAsset(a: BridgeAsset, b: BridgeAsset): boolean {
  return assetKey(a) === assetKey(b)
}

// Quotes -----------------------------------------------------------------------

export interface QuoteRequest { asset: BridgeAsset; fromChain: BridgeChain; toChain: BridgeChain; amountIn: number }
export interface BridgeQuote {
  asset: BridgeAsset
  fromChain: BridgeChain
  toChain: BridgeChain
  amountIn: number
  amountOut: number
  fee: number
  feeSymbol: string
  minReceived: number
  estimatedSeconds: number | null
  routerId: string
  fetchedAtMs: number
}
export type QuoteOutcome =
  | { status: "ok"; quote: BridgeQuote }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string }

export interface BridgeRouter {
  id: string
  label: string
  available: boolean
  quote(req: QuoteRequest): Promise<QuoteOutcome>
}

export const unavailableRouter: BridgeRouter = {
  id: "none",
  label: "No bridge connected",
  available: false,
  async quote(): Promise<QuoteOutcome> {
    return {
      status: "unavailable",
      message:
        "No canonical bridge is live for Arc Testnet yet. AetherFI will never invent a route, fee or arrival time — real estimates appear here the moment a bridge is connected.",
    }
  },
}

export function getBridgeRouter(): BridgeRouter {
  return unavailableRouter
}

// Validation -------------------------------------------------------------------

export interface BridgeValidation {
  amountValid: boolean // positive, finite amount entered
  distinctChains: boolean // source ≠ destination
  withinBalance: boolean // amount ≤ available balance of the asset
  ready: boolean // safe to request a quote
  reason: string | null // first human-readable problem, or null
}

export function validateBridge(
  amountIn: string,
  asset: BridgeAsset | null,
  fromChain: BridgeChain | null,
  toChain: BridgeChain | null,
  balance: number,
): BridgeValidation {
  const n = Number(amountIn)
  const amountValid = amountIn.trim().length > 0 && Number.isFinite(n) && n > 0
  const distinctChains = !!fromChain && !!toChain && fromChain.id !== toChain.id
  const withinBalance = amountValid && Number.isFinite(balance) && n <= balance

  let reason: string | null = null
  if (!asset) reason = "Choose an asset to bridge."
  else if (!fromChain || !toChain) reason = "Choose both networks."
  else if (!distinctChains) reason = "Pick two different networks."
  else if (amountIn.trim().length > 0 && !amountValid) reason = "Enter an amount greater than zero."
  else if (amountValid && !withinBalance) reason = `You only hold ${balance} ${asset.symbol}.`

  const ready = amountValid && distinctChains && withinBalance
  return { amountValid, distinctChains, withinBalance, ready, reason }
}

// Lifecycle state machine ------------------------------------------------------
// Mirrors lib/swap exactly. Phases: idle → quoting → quoted | unavailable |
// error → signing → confirming → success. Editing inputs discards a stale quote
// unless a bridge is already signing/confirming (locked).

export type BridgePhase =
  | "idle"
  | "quoting"
  | "quoted"
  | "unavailable"
  | "signing"
  | "confirming"
  | "success"
  | "error"

export interface BridgeState {
  phase: BridgePhase
  quote: BridgeQuote | null
  message: string | null
  txHash: string | null
}

export const initialBridgeState: BridgeState = { phase: "idle", quote: null, message: null, txHash: null }

export type BridgeEvent =
  | { type: "INPUT_CHANGED" }
  | { type: "QUOTE_REQUESTED" }
  | { type: "QUOTE_RESULT"; outcome: QuoteOutcome }
  | { type: "SIGN_STARTED" }
  | { type: "SUBMITTED"; txHash: string }
  | { type: "CONFIRMED" }
  | { type: "FAILED"; message: string }
  | { type: "RESET" }

export function bridgeReducer(state: BridgeState, event: BridgeEvent): BridgeState {
  switch (event.type) {
    case "INPUT_CHANGED":
      if (state.phase === "signing" || state.phase === "confirming") return state
      return initialBridgeState

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
      return initialBridgeState

    default:
      return state
  }
}

export function isBusy(phase: BridgePhase): boolean {
  return phase === "quoting" || phase === "signing" || phase === "confirming"
}
export function canSign(phase: BridgePhase): boolean {
  return phase === "quoted"
}
