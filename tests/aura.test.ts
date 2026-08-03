import { describe, it, expect } from "vitest"
import { auraParams, seedFromAddress } from "@/lib/aura"
import type { WalletKundli } from "@/lib/arc"

// The aura shader params feed the WebGL canvas and the OG share image, so they
// must stay normalized (0..1) and deterministic for a given wallet.

function kundli(overrides: Partial<WalletKundli>): WalletKundli {
  return {
    address: "0x0000000000000000000000000000000000000000",
    balanceUSDC: 0,
    txCount: 0,
    gasUsed: 0,
    tokenTransfers: 0,
    firstTxDate: null,
    lastTxDate: null,
    walletAgeDays: 0,
    isContract: false,
    score: 0,
    rank: "Fresh Wallet",
    percentile: 5,
    badges: [],
    activityByDay: [],
    ...overrides,
  }
}

describe("auraParams", () => {
  it("returns a calm default when there is no wallet data", () => {
    expect(auraParams(null)).toEqual({ energy: 0.4, density: 0.35, pulse: 0.35, rings: 0.35 })
  })

  it("keeps every param clamped to 0..1 for extreme inputs", () => {
    const p = auraParams(kundli({ score: 5000, txCount: 1e9, balanceUSDC: 1e12, walletAgeDays: 10_000 }))
    for (const v of Object.values(p)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it("maps score directly to energy", () => {
    expect(auraParams(kundli({ score: 500 })).energy).toBeCloseTo(0.5, 5)
  })
})

describe("seedFromAddress", () => {
  it("is deterministic for the same address", () => {
    const a = seedFromAddress("0xAbC123")
    const b = seedFromAddress("0xabc123")
    expect(a).toEqual(b) // case-insensitive
  })

  it("produces four seeds in [0,1)", () => {
    const seeds = seedFromAddress("0xdeadbeef")
    expect(seeds).toHaveLength(4)
    for (const s of seeds) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(1)
    }
  })

  it("gives different wallets different seeds", () => {
    expect(seedFromAddress("0xaaaa")).not.toEqual(seedFromAddress("0xbbbb"))
  })
})
