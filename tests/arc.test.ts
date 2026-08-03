import { describe, it, expect } from "vitest"
import { computeScore, rankFor, computeBadges } from "@/lib/arc"

// Seed coverage for the scoring and badge logic. These are pure functions with
// no network or DOM, so they're the highest-value correctness surface to lock in.

describe("computeScore", () => {
  it("returns 0 for an empty wallet", () => {
    expect(computeScore({ balanceUSDC: 0, txCount: 0, gasUsed: 0, tokenTransfers: 0, walletAgeDays: 0 })).toBe(0)
  })

  it("stays within the 0..1000 range for a whale", () => {
    const score = computeScore({
      balanceUSDC: 5_000_000,
      txCount: 100_000,
      gasUsed: 500_000_000,
      tokenTransfers: 10_000,
      walletAgeDays: 365,
    })
    expect(score).toBeGreaterThan(800)
    expect(score).toBeLessThanOrEqual(1000)
  })

  it("rewards activity over idle age", () => {
    const active = computeScore({ balanceUSDC: 0, txCount: 500, gasUsed: 0, tokenTransfers: 0, walletAgeDays: 0 })
    const idle = computeScore({ balanceUSDC: 0, txCount: 0, gasUsed: 0, tokenTransfers: 0, walletAgeDays: 30 })
    expect(active).toBeGreaterThan(idle)
  })
})

describe("rankFor", () => {
  it("maps score thresholds to the expected rank tiers", () => {
    expect(rankFor(0).rank).toBe("Fresh Wallet")
    expect(rankFor(120).rank).toBe("Newcomer")
    expect(rankFor(300).rank).toBe("Explorer")
    expect(rankFor(500).rank).toBe("Active Builder")
    expect(rankFor(700).rank).toBe("Arc Pioneer")
    expect(rankFor(900).rank).toBe("Arc Legend")
  })

  it("keeps percentile monotonic with score", () => {
    expect(rankFor(900).percentile).toBeGreaterThan(rankFor(300).percentile)
  })
})

describe("computeBadges", () => {
  const base = {
    balanceUSDC: 0,
    txCount: 0,
    gasUsed: 0,
    tokenTransfers: 0,
    walletAgeDays: 0,
    isContract: false,
    hasTokens: false,
  }

  it("earns nothing for a brand-new empty wallet", () => {
    const earned = computeBadges(base).filter((b) => b.earned)
    expect(earned).toHaveLength(0)
  })

  it("earns the whale badge at 1000+ USDC", () => {
    const badges = computeBadges({ ...base, balanceUSDC: 1500 })
    expect(badges.find((b) => b.id === "whale")?.earned).toBe(true)
  })

  it("flags an early faucet farmer (funded, few tx)", () => {
    const badges = computeBadges({ ...base, balanceUSDC: 25, txCount: 2 })
    expect(badges.find((b) => b.id === "faucet")?.earned).toBe(true)
  })

  it("earns the veteran badge only with both age and tx history", () => {
    const partial = computeBadges({ ...base, walletAgeDays: 90, txCount: 10 })
    expect(partial.find((b) => b.id === "veteran")?.earned).toBe(false)
    const full = computeBadges({ ...base, walletAgeDays: 90, txCount: 150 })
    expect(full.find((b) => b.id === "veteran")?.earned).toBe(true)
  })
})
