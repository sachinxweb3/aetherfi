import { describe, it, expect } from "vitest"
import {
  oracleAssetsFromHoldings, assetKey, sameAsset, quoteFor,
  fmtUsd, fmtConfidence, fmtAge,
  oracleReducer, initialOracleState, isReading,
  getOracle, unavailableOracle,
  type OracleAsset, type FeedOutcome, type PriceQuote,
} from "../lib/oracle"
import type { Holding } from "../lib/arc"

// Pure core of the Oracle module — asset derivation, formatting, the honest
// "no oracle" adapter, and the read lifecycle reducer. No React, no wallet, no
// network is exercised here (mirrors tests/swap.test.ts and tests/bridge.test.ts).

const native: OracleAsset = { symbol: "USDC", name: "USD Coin", contract: null, decimals: 18 }
const aeth: OracleAsset = { symbol: "AETH", name: "Aether", contract: "0xAbC123", decimals: 18 }

const holding = (over: Partial<Holding>): Holding => ({
  symbol: "USDC", name: "USD Coin", amount: 100, decimals: 18, isNative: true, contract: null, ...over,
})

describe("asset helpers", () => {
  it("derives oracle assets from real holdings, preserving contract/decimals", () => {
    const assets = oracleAssetsFromHoldings([
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
})

describe("formatting — never fabricates for missing data", () => {
  it("formats USD with more precision under $1", () => {
    expect(fmtUsd(1234.5)).toBe("$1,234.50")
    expect(fmtUsd(0.123456)).toBe("$0.123456")
    expect(fmtUsd(Number.NaN)).toBe("—")
  })

  it("formats confidence as a ± percent band", () => {
    expect(fmtConfidence(50)).toBe("±0.5%")
    expect(fmtConfidence(250)).toBe("±2.5%")
    expect(fmtConfidence(Number.NaN)).toBe("—")
  })

  it("formats feed age against a caller-provided now", () => {
    const now = 1_000_000_000
    expect(fmtAge(now, now)).toBe("just now")
    expect(fmtAge(now - 30_000, now)).toBe("30s ago")
    expect(fmtAge(now - 5 * 60_000, now)).toBe("5 min ago")
    expect(fmtAge(now - 2 * 3_600_000, now)).toBe("2h ago")
  })
})

describe("honest default oracle", () => {
  it("reports pricing as unavailable — never a fabricated price/source/confidence", async () => {
    expect(getOracle()).toBe(unavailableOracle)
    expect(unavailableOracle.available).toBe(false)
    const outcome = await unavailableOracle.read([native, aeth])
    expect(outcome.status).toBe("unavailable")
    if (outcome.status === "unavailable") expect(outcome.message).toMatch(/never invent/i)
  })

  it("quoteFor returns null when there is no live quote", () => {
    expect(quoteFor(null, native)).toBeNull()
    expect(quoteFor([], native)).toBeNull()
  })
})

describe("oracle read lifecycle", () => {
  const quote: PriceQuote = {
    asset: native, priceUsd: 1.0, confidenceBps: 20, updatedAtMs: 123, feedId: "test", source: "TestFeed",
  }
  const ok: FeedOutcome = { status: "ok", quotes: [quote] }

  it("requests → reading → live, exposing real quotes", () => {
    let s = oracleReducer(initialOracleState, { type: "READ_REQUESTED" })
    expect(s.phase).toBe("reading")
    expect(isReading(s.phase)).toBe(true)
    s = oracleReducer(s, { type: "READ_RESULT", outcome: ok })
    expect(s.phase).toBe("live")
    expect(s.quotes).toEqual([quote])
    expect(quoteFor(s.quotes, native)).toEqual(quote)
  })

  it("surfaces unavailable and error outcomes distinctly, with no quotes", () => {
    const r = oracleReducer(initialOracleState, { type: "READ_REQUESTED" })
    const u = oracleReducer(r, { type: "READ_RESULT", outcome: { status: "unavailable", message: "no oracle" } })
    expect(u.phase).toBe("unavailable")
    expect(u.quotes).toBeNull()
    const e = oracleReducer(r, { type: "READ_RESULT", outcome: { status: "error", message: "boom" } })
    expect(e.phase).toBe("error")
    expect(e.message).toBe("boom")
  })

  it("ignores a stale read result that arrives outside the reading phase", () => {
    const s = oracleReducer(initialOracleState, { type: "READ_RESULT", outcome: ok })
    expect(s).toBe(initialOracleState)
  })

  it("allows re-reading from a settled phase", () => {
    const live = oracleReducer(oracleReducer(initialOracleState, { type: "READ_REQUESTED" }), { type: "READ_RESULT", outcome: ok })
    const rereading = oracleReducer(live, { type: "READ_REQUESTED" })
    expect(rereading.phase).toBe("reading")
    expect(rereading.quotes).toBeNull()
  })

  it("FAILED records a real message, and RESET returns to the start", () => {
    const failed = oracleReducer(initialOracleState, { type: "FAILED", message: "network down" })
    expect(failed.phase).toBe("error")
    expect(failed.message).toBe("network down")
    expect(oracleReducer(failed, { type: "RESET" })).toEqual(initialOracleState)
  })
})
