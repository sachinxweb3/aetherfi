import { describe, it, expect } from "vitest"
import { flowStats, successRate, busiestDay, activeStreak, activityTrend, counterpartyStats } from "../lib/analytics"
import { scoreBreakdown, computeScore } from "../lib/arc"
import type { ArcTx } from "../lib/arc"

// Analytics aggregation — real math over the tx sample (File 06, File 12).
const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "in",
  valueUSDC: 0, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})

describe("flowStats", () => {
  it("aggregates in/out/self, net, gas, and failures", () => {
    const s = flowStats([
      tx({ direction: "in", valueUSDC: 10 }),
      tx({ direction: "out", valueUSDC: 4, feeUSDC: 0.01 }),
      tx({ direction: "out", valueUSDC: 1, feeUSDC: 0.02, status: "error" }),
      tx({ direction: "self", valueUSDC: 0, feeUSDC: 0.03 }),
    ])
    expect(s.inCount).toBe(1)
    expect(s.outCount).toBe(2)
    expect(s.selfCount).toBe(1)
    expect(s.totalIn).toBe(10)
    expect(s.totalOut).toBe(5)
    expect(s.net).toBe(5)
    expect(s.failed).toBe(1)
    expect(Number(s.gasSpent.toFixed(2))).toBe(0.06)
    expect(s.sampleSize).toBe(4)
  })
  it("is all-zero for an empty sample", () => {
    const s = flowStats([])
    expect(s.net).toBe(0)
    expect(s.sampleSize).toBe(0)
  })
})

describe("successRate", () => {
  it("is 100 with no tx and reflects failures otherwise", () => {
    expect(successRate([])).toBe(100)
    expect(successRate([tx({ status: "ok" }), tx({ status: "error" })])).toBe(50)
  })
})

describe("busiestDay / activeStreak", () => {
  const days = [
    { date: "2026-07-29", count: 0 },
    { date: "2026-07-30", count: 5 },
    { date: "2026-07-31", count: 2 },
    { date: "2026-08-01", count: 3 },
  ]
  it("finds the busiest day", () => {
    expect(busiestDay(days)).toEqual({ date: "2026-07-30", count: 5 })
    expect(busiestDay([])).toBeNull()
  })
  it("counts the trailing active streak", () => {
    expect(activeStreak(days)).toBe(3)
    expect(activeStreak([{ date: "x", count: 0 }])).toBe(0)
  })
})

describe("activityTrend", () => {
  it("summarizes totals, peak, active days and momentum", () => {
    const days = [
      { date: "d0", count: 1 },
      { date: "d1", count: 1 },
      { date: "d2", count: 0 },
      { date: "d3", count: 4 },
    ]
    const t = activityTrend(days)
    expect(t.total).toBe(6)
    expect(t.peak).toBe(4)
    expect(t.activeDays).toBe(3)
    expect(t.window).toBe(4)
    // older half = d0+d1 = 2, recent half = d2+d3 = 4 → +100%
    expect(t.deltaPct).toBe(100)
  })
  it("is empty-safe and reports null momentum with no prior activity", () => {
    const t = activityTrend([{ date: "a", count: 0 }, { date: "b", count: 3 }])
    expect(t.deltaPct).toBeNull()
    expect(activityTrend([]).total).toBe(0)
    expect(activityTrend([]).peak).toBe(1) // floored for safe bar scaling
  })
})

describe("counterpartyStats", () => {
  it("counts distinct counterparties and finds the most frequent, case-insensitively", () => {
    const s = counterpartyStats([
      tx({ direction: "in", from: "0xAAA" }),
      tx({ direction: "in", from: "0xaaa" }), // same peer, different case
      tx({ direction: "out", to: "0xBBB" }),
      tx({ direction: "out", to: "0xCCC" }),
    ])
    expect(s.unique).toBe(3)
    expect(s.top).toEqual({ address: "0xaaa", count: 2 })
    expect(s.sampleSize).toBe(4)
  })
  it("skips self-transfers (no external counterparty) and is empty-safe", () => {
    const s = counterpartyStats([tx({ direction: "self", from: "0xa", to: "0xa" })])
    expect(s.unique).toBe(0)
    expect(s.top).toBeNull()
    const e = counterpartyStats([])
    expect(e.unique).toBe(0)
    expect(e.top).toBeNull()
    expect(e.sampleSize).toBe(0)
  })
})

describe("scoreBreakdown", () => {
  it("sums to the same value as computeScore", () => {
    const input = { balanceUSDC: 500, txCount: 120, gasUsed: 2_000_000, tokenTransfers: 8, walletAgeDays: 45 }
    const fromBreakdown = Math.round(
      scoreBreakdown(input).reduce((s, f) => s + f.factor * f.weight, 0) * 1000,
    )
    expect(fromBreakdown).toBe(computeScore(input))
  })
  it("weights sum to 1 and points never exceed the weight cap", () => {
    const input = { balanceUSDC: 1e9, txCount: 1e6, gasUsed: 1e9, tokenTransfers: 1e6, walletAgeDays: 999 }
    const b = scoreBreakdown(input)
    expect(Number(b.reduce((s, f) => s + f.weight, 0).toFixed(3))).toBe(1)
    for (const f of b) expect(f.points).toBeLessThanOrEqual(Math.round(f.weight * 1000))
  })
})
