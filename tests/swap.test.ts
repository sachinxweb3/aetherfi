import { describe, it, expect } from "vitest"
import {
  swapTokensFromHoldings, tokenKey, sameToken,
  applySlippage, fmtSlippage, SLIPPAGE_OPTIONS_BPS, DEFAULT_SLIPPAGE_BPS,
  validateSwap,
  swapReducer, initialSwapState, isBusy, canSign,
  getSwapRouter, unavailableRouter,
  type SwapToken, type QuoteOutcome, type SwapQuote,
} from "../lib/swap"
import type { Holding } from "../lib/arc"

// Pure core of the Swap module — token derivation, slippage math, input
// validation, the honest "no router" adapter, and the lifecycle reducer. No
// React, no wallet, no network is exercised here (mirrors the module's design).

const native: SwapToken = { symbol: "USDC", name: "USD Coin", contract: null, decimals: 18 }
const aeth: SwapToken = { symbol: "AETH", name: "Aether", contract: "0xAbC123", decimals: 18 }

const holding = (over: Partial<Holding>): Holding => ({
  symbol: "USDC", name: "USD Coin", amount: 100, decimals: 18, isNative: true, contract: null, ...over,
})

describe("token helpers", () => {
  it("derives swap tokens from real holdings, preserving contract/decimals", () => {
    const tokens = swapTokensFromHoldings([
      holding({}),
      holding({ symbol: "AETH", name: "Aether", isNative: false, contract: "0xAbC123" }),
    ])
    expect(tokens).toEqual([
      { symbol: "USDC", name: "USD Coin", contract: null, decimals: 18 },
      { symbol: "AETH", name: "Aether", contract: "0xAbC123", decimals: 18 },
    ])
  })

  it("keys native by symbol and tokens by lowercased contract", () => {
    expect(tokenKey(native)).toBe("native:usdc")
    expect(tokenKey(aeth)).toBe("0xabc123")
  })

  it("treats identity by key, case-insensitively for contracts", () => {
    expect(sameToken(aeth, { ...aeth, contract: "0xABC123" })).toBe(true)
    expect(sameToken(native, aeth)).toBe(false)
  })
})

describe("slippage", () => {
  it("exposes the required tolerances and a sane default", () => {
    expect(SLIPPAGE_OPTIONS_BPS).toEqual([10, 50, 100])
    expect(SLIPPAGE_OPTIONS_BPS).toContain(DEFAULT_SLIPPAGE_BPS)
  })

  it("applies a floor after tolerance and clamps bad input", () => {
    expect(applySlippage(100, 50)).toBeCloseTo(99.5)
    expect(applySlippage(100, 0)).toBe(100)
    expect(applySlippage(0, 50)).toBe(0)
    expect(applySlippage(-5, 50)).toBe(0)
    expect(applySlippage(100, 999_999)).toBe(0) // clamped to 100%
  })

  it("formats bps as a percent label", () => {
    expect(fmtSlippage(10)).toBe("0.1%")
    expect(fmtSlippage(50)).toBe("0.5%")
    expect(fmtSlippage(100)).toBe("1%")
  })
})

describe("validateSwap", () => {
  it("is not ready until both tokens, a positive amount, and balance are satisfied", () => {
    expect(validateSwap("", native, aeth, 100).ready).toBe(false)
    expect(validateSwap("5", native, null, 100).reason).toMatch(/both tokens/)
    expect(validateSwap("5", native, native, 100).reason).toMatch(/two different/)
    expect(validateSwap("0", native, aeth, 100).reason).toMatch(/greater than zero/)
    expect(validateSwap("500", native, aeth, 100).reason).toMatch(/only hold 100/)
  })

  it("is ready for a valid, affordable, distinct swap", () => {
    const v = validateSwap("50", native, aeth, 100)
    expect(v).toMatchObject({ amountValid: true, distinctTokens: true, withinBalance: true, ready: true, reason: null })
  })

  it("never fabricates an error for an empty field — it is simply not ready", () => {
    const v = validateSwap("", native, aeth, 100)
    expect(v.reason).toBeNull()
    expect(v.ready).toBe(false)
  })
})

describe("honest default router", () => {
  it("reports routing as unavailable — never a fabricated quote", async () => {
    expect(getSwapRouter()).toBe(unavailableRouter)
    expect(unavailableRouter.available).toBe(false)
    const outcome = await unavailableRouter.quote({ from: native, to: aeth, amountIn: 5, slippageBps: 50 })
    expect(outcome.status).toBe("unavailable")
    if (outcome.status === "unavailable") expect(outcome.message).toMatch(/never invent a rate/i)
  })
})

describe("swap reducer lifecycle", () => {
  const quote: SwapQuote = {
    from: native, to: aeth, amountIn: 10, amountOut: 9.9, rate: 0.99,
    minReceived: 9.85, slippageBps: 50, priceImpactBps: null, routerId: "test", fetchedAtMs: 0,
  }
  const ok: QuoteOutcome = { status: "ok", quote }

  it("requests → quotes → quoted, exposing a real quote to review", () => {
    let s = swapReducer(initialSwapState, { type: "QUOTE_REQUESTED" })
    expect(s.phase).toBe("quoting")
    expect(isBusy(s.phase)).toBe(true)
    s = swapReducer(s, { type: "QUOTE_RESULT", outcome: ok })
    expect(s.phase).toBe("quoted")
    expect(s.quote).toEqual(quote)
    expect(canSign(s.phase)).toBe(true)
  })

  it("surfaces unavailable and error outcomes distinctly, with no quote", () => {
    const q = swapReducer(initialSwapState, { type: "QUOTE_REQUESTED" })
    const u = swapReducer(q, { type: "QUOTE_RESULT", outcome: { status: "unavailable", message: "no router" } })
    expect(u.phase).toBe("unavailable")
    expect(u.quote).toBeNull()
    const e = swapReducer(q, { type: "QUOTE_RESULT", outcome: { status: "error", message: "boom" } })
    expect(e.phase).toBe("error")
    expect(e.message).toBe("boom")
  })

  it("ignores a stale quote result that arrives outside the quoting phase", () => {
    const s = swapReducer(initialSwapState, { type: "QUOTE_RESULT", outcome: ok })
    expect(s).toBe(initialSwapState)
  })

  it("editing an input discards a stale quote and returns to idle", () => {
    const quoted = swapReducer(swapReducer(initialSwapState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok })
    const edited = swapReducer(quoted, { type: "INPUT_CHANGED" })
    expect(edited).toEqual(initialSwapState)
  })

  it("drives the full sign → confirm → success path only from a quote", () => {
    let s = swapReducer(swapReducer(initialSwapState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok })
    s = swapReducer(s, { type: "SIGN_STARTED" })
    expect(s.phase).toBe("signing")
    s = swapReducer(s, { type: "SUBMITTED", txHash: "0xhash" })
    expect(s.phase).toBe("confirming")
    expect(s.txHash).toBe("0xhash")
    s = swapReducer(s, { type: "CONFIRMED" })
    expect(s.phase).toBe("success")
  })

  it("cannot sign without a real quote, and locks inputs while signing", () => {
    const idleSign = swapReducer(initialSwapState, { type: "SIGN_STARTED" })
    expect(idleSign).toBe(initialSwapState)
    const signing = swapReducer(
      swapReducer(swapReducer(initialSwapState, { type: "QUOTE_REQUESTED" }), { type: "QUOTE_RESULT", outcome: ok }),
      { type: "SIGN_STARTED" },
    )
    expect(swapReducer(signing, { type: "INPUT_CHANGED" })).toBe(signing) // locked
  })

  it("FAILED records a real message, and RESET returns to the start", () => {
    const failed = swapReducer(initialSwapState, { type: "FAILED", message: "network down" })
    expect(failed.phase).toBe("error")
    expect(failed.message).toBe("network down")
    expect(swapReducer(failed, { type: "RESET" })).toEqual(initialSwapState)
  })
})
