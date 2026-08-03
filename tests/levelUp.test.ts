import { describe, it, expect } from "vitest"
import { levelUpPlan, nextRankGap } from "../lib/levelUp"
import { scoreBreakdown, type ScoreInput } from "../lib/arc"

// Deterministic "level up" recommendations over the REAL score math (File 06,
// File 16). Projections must equal what scoreBreakdown() would actually award.
const input = (over: Partial<ScoreInput>): ScoreInput => ({
  balanceUSDC: 100, txCount: 10, gasUsed: 5000, tokenTransfers: 2, walletAgeDays: 20, ...over,
})

const scoreOf = (i: ScoreInput) => scoreBreakdown(i).reduce((s, f) => s + f.points, 0)

describe("nextRankGap", () => {
  it("names the next rank and the point gap", () => {
    expect(nextRankGap(180)).toEqual({ toNextRank: 20, nextRank: "Explorer" })
    expect(nextRankGap(0)).toEqual({ toNextRank: 50, nextRank: "Newcomer" })
  })
  it("returns no gap at the top tier", () => {
    expect(nextRankGap(850)).toEqual({ toNextRank: 0, nextRank: null })
  })
})

describe("levelUpPlan", () => {
  it("reports the real current score", () => {
    const i = input({})
    expect(levelUpPlan(i).score).toBe(scoreOf(i))
  })

  it("projects gains that match the real formula exactly", () => {
    const i = input({ txCount: 10 })
    const plan = levelUpPlan(i)
    const txTip = plan.tips.find((t) => t.key === "txCount")
    expect(txTip).toBeDefined()
    // The promised gain must equal re-scoring with +5 transactions.
    const expected = scoreOf({ ...i, txCount: 15 }) - scoreOf(i)
    expect(txTip!.gain).toBe(expected)
  })

  it("ranks tips by descending projected gain", () => {
    const plan = levelUpPlan(input({}))
    const gains = plan.tips.map((t) => t.gain)
    expect(gains).toEqual([...gains].sort((a, b) => b - a))
  })

  it("omits factors with no headroom (already maxed)", () => {
    // A very old wallet gets no meaningful age gain from +7 days.
    const plan = levelUpPlan(input({ walletAgeDays: 90 }))
    expect(plan.tips.find((t) => t.key === "walletAgeDays")).toBeUndefined()
  })

  it("every tip has a positive gain and an actionable link", () => {
    for (const t of levelUpPlan(input({})).tips) {
      expect(t.gain).toBeGreaterThan(0)
      expect(t.href.startsWith("/")).toBe(true)
      expect(t.detail.length).toBeGreaterThan(0)
    }
  })
})
