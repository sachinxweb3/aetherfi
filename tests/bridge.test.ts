import { describe, it, expect } from "vitest"
import {
  bridgeAssetsFromHoldings, assetKey, sameAsset,
  ARC_CHAIN, BRIDGE_DESTINATIONS, DEFAULT_DESTINATION_ID, chainById,
  validateBridge,
  bridgeReducer, initialBridgeState, isBusy, canSign,
  getBridgeRouter, unavailableRouter,
  type BridgeAsset, type QuoteOutcome, type BridgeQuote,
} from "../lib/bridge"
import type { Holding } from "../lib/arc"

// Pure core of the Bridge module — asset/chain derivation, input validation,
// the honest "no bridge" adapter, and the lifecycle reducer. No React, no
// wallet, no network is exercised here (mirrors tests/swap.test.ts).

const native: BridgeAsset = { symbol: "USDC", name: "USD Coin", contract: null, decimals: 18 }
const aeth: BridgeAsset = { symbol: "AETH", name: "Aether", contract: "0xAbC123", decimals: 18 }
const sepolia = BRIDGE_DESTINATIONS[0]

const holding = (over: Partial<Holding>): Holding => ({
  symbol: "USDC", name: "USD Coin", amount: 100, decimals: 18, isNative: true, contract: null, ...over,
})

describe("asset & chain helpers", () => {
  it("derives bridge assets from real holdings, preserving contract/decimals", () => {
    const assets = bridgeAssetsFromHoldings([
      holding({}),
      holding({ symbol: "AETH", name: "Aether", isNative: false, contract: "0xAbC123" }),
    ])
    expect(assets).toEqual([
      { symbol: "USDC", name: "USD Coin", contract: null, decimals: 18 },
      { symbol: "AETH", name: "Aether", contract: "0xAbC123", decimals: 18 },
    ])
  })

  it("keys native by symbol and tokens by lowercased contract", () => {
    expect(assetKey(native)).toBe("native:usdc")
    expect(assetKey(aeth)).toBe("0xabc123")
    expect(sameAsset(aeth, { ...aeth, contract: "0xABC123" })).toBe(true)
    expect(sameAsset(native, aeth)).toBe(false)
  })

  it("fixes Arc as source and resolves real destinations by id", () => {
    expect(ARC_CHAIN.id).toBe(5042002)
    expect(BRIDGE_DESTINATIONS.length).toBeGreaterThan(0)
    expect(BRIDGE_DESTINATIONS.some((c) => c.id === DEFAULT_DESTINATION_ID)).toBe(true)
    expect(chainById(ARC_CHAIN.id)).toEqual(ARC_CHAIN)
    expect(chainById(sepolia.id)).toEqual(sepolia)
    expect(chainById(999999)).toBeNull()
    expect(chainById(null)).toBeNull()
  })
})

describe("validateBridge", () => {
  it("is not ready until asset, distinct chains, a positive amount, and balance hold", () => {
    expect(validateBridge("", native, ARC_CHAIN, sepolia, 100).ready).toBe(false)
    expect(validateBridge("5", null, ARC_CHAIN, sepolia, 100).reason).toMatch(/an asset/)
    expect(validateBridge("5", native, ARC_CHAIN, null, 100).reason).toMatch(/both networks/)
    expect(validateBridge("5", native, ARC_CHAIN, ARC_CHAIN, 100).reason).toMatch(/two different/)
    expect(validateBridge("0", native, ARC_CHAIN, sepolia, 100).reason).toMatch(/greater than zero/)
    expect(validateBridge("500", native, ARC_CHAIN, sepolia, 100).reason).toMatch(/only hold 100/)
  })

  it("is ready for a valid, affordable, cross-network bridge", () => {
    const v = validateBridge("50", native, ARC_CHAIN, sepolia, 100)
    expect(v).toMatchObject({ amountValid: true, distinctChains: true, withinBalance: true, ready: true, reason: null })
  })

  it("never fabricates an error for an empty field — it is simply not ready", () => {
    const v = validateBridge("", native, ARC_CHAIN, sepolia, 100)
    expect(v.reason).toBeNull()
    expect(v.ready).toBe(false)
  })
})

describe("honest default router", () => {
  it("reports bridging as unavailable — never a fabricated route/fee/ETA", async () => {
    expect(getBridgeRouter()).toBe(unavailableRouter)
    expect(unavailableRouter.available).toBe(false)
    const outcome = await unavailableRouter.quote({ asset: native, fromChain: ARC_CHAIN, toChain: sepolia, amountIn: 5 })
    expect(outcome.status).toBe("unavailable")
    if (outcome.status === "unavailable") expect(outcome.message).toMatch(/never invent/i)
  })
})

describe("bridge reducer lifecycle", () => {
  const quote: BridgeQuote = {
    asset: native, fromChain: ARC_CHAIN, toChain: sepolia, amountIn: 10, amountOut: 9.9,
    fee: 0.1, feeSymbol: "USDC", minReceived: 9.85, estimatedSeconds: 180, routerId: "test", fetchedAtMs: 0,
  }
  const ok: QuoteOutcome = { status: "ok", quote }

  it("requests → quotes → quoted, exposing a real quote to review", () => {
    let s = bridgeReducer(initialBridgeState, { type: "QUOTE_REQUESTED" })
    expect(s.phase).toBe("quoting")
    expect(isBusy(s.phase)).toBe(true)
    s = bridgeReducer(s, { type: "QUOTE_RESULT", outcome: ok })
    expect(s.phase).toBe("quoted")
    expect(s.quote).toEqual(quote)
    expect(canSign(s.phase)).toBe(true)
  })

  it("surfaces unavailable and error outcomes distinctly, with no quote", () => {
    const q = bridgeReducer(initialBridgeState, { type: "QUOTE_REQUESTED" })
    const u = bridgeReducer(q, { type: "QUOTE_RESULT", outcome: { status: "unavailable", message: "no bridge" } })
    expect(u.phase).toBe("unavailable")
    expect(u.quote).toBeNull()
    const e = bridgeReducer(q, { type: "QUOTE_RESULT", outcome: { status: "error", message: "boom" } })
    expect(e.phase).toBe("error")
    expect(e.message).toBe("boom")
  })

  it("ignores a stale quote result that arrives outside the quoting phase", () => {
    const s = bridgeReducer(initialBridgeState, { type: "QUOTE_RESULT", outcome: ok })
    expect(s).toBe(initialBridgeState)
  })

  it("editing an input discards a stale quote and returns to idle", () => {
    const quoted = bridgeReducer(bridgeReducer(initialBridgeState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok })
    expect(bridgeReducer(quoted, { type: "INPUT_CHANGED" })).toEqual(initialBridgeState)
  })

  it("drives the full sign → confirm → success path only from a quote", () => {
    let s = bridgeReducer(bridgeReducer(initialBridgeState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok })
    s = bridgeReducer(s, { type: "SIGN_STARTED" })
    expect(s.phase).toBe("signing")
    s = bridgeReducer(s, { type: "SUBMITTED", txHash: "0xhash" })
    expect(s.phase).toBe("confirming")
    expect(s.txHash).toBe("0xhash")
    s = bridgeReducer(s, { type: "CONFIRMED" })
    expect(s.phase).toBe("success")
  })

  it("cannot sign without a real quote, and locks inputs while signing", () => {
    expect(bridgeReducer(initialBridgeState, { type: "SIGN_STARTED" })).toBe(initialBridgeState)
    const signing = bridgeReducer(
      bridgeReducer(bridgeReducer(initialBridgeState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok }),
      { type: "SIGN_STARTED" },
    )
    expect(bridgeReducer(signing, { type: "INPUT_CHANGED" })).toBe(signing)
  })

  it("FAILED records a real message, and RESET returns to the start", () => {
    const failed = bridgeReducer(initialBridgeState, { type: "FAILED", message: "network down" })
    expect(failed.phase).toBe("error")
    expect(failed.message).toBe("network down")
    expect(bridgeReducer(failed, { type: "RESET" })).toEqual(initialBridgeState)
  })
})
