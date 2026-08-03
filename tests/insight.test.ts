import { describe, it, expect } from "vitest"
import { buildInsight, topSignals } from "../lib/insight"
import { relTime } from "../app/(app)/dashboard/page"
import type { WalletKundli, ArcTx } from "../lib/arc"

// Deterministic dashboard intelligence (File 06) + relative-time formatting.
const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "in",
  valueUSDC: 0, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})

const kundli = (over: Partial<WalletKundli>): WalletKundli => ({
  address: "0xself", balanceUSDC: 100, txCount: 10, gasUsed: 1000, tokenTransfers: 2,
  walletAgeDays: 30, score: 300, rank: "Explorer", percentile: 50,
  badges: [], activityByDay: Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: 0 })),
  ...over,
})

describe("buildInsight priority rules", () => {
  it("flags failed transactions first", () => {
    const i = buildInsight(kundli({}), [tx({ status: "error", direction: "out" })])
    expect(i.tone).toBe("caution")
    expect(i.headline).toMatch(/failed/)
  })
  it("prompts funding when balance is zero", () => {
    const i = buildInsight(kundli({ balanceUSDC: 0 }), [])
    expect(i.headline).toMatch(/Fund your wallet/)
  })
  it("reports net inflow over a sample of 3+", () => {
    const i = buildInsight(kundli({}), [
      tx({ direction: "in", valueUSDC: 10 }),
      tx({ direction: "in", valueUSDC: 5 }),
      tx({ direction: "out", valueUSDC: 3 }),
    ])
    expect(i.tone).toBe("positive")
    expect(i.headline).toMatch(/Net inflow/)
  })
  it("celebrates an activity streak", () => {
    const days = Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: i >= 11 ? 2 : 0 }))
    const i = buildInsight(kundli({ activityByDay: days }), [])
    expect(i.headline).toMatch(/streak/)
  })
  it("falls back to a cold-start message", () => {
    const i = buildInsight(kundli({ score: 10, txCount: 0 }), [])
    expect(i.headline).toMatch(/just beginning/)
  })
  it("attaches an actionable CTA to every insight", () => {
    const cases = [
      buildInsight(kundli({}), [tx({ status: "error", direction: "out" })]),
      buildInsight(kundli({ balanceUSDC: 0 }), []),
      buildInsight(kundli({}), [tx({ direction: "in", valueUSDC: 10 }), tx({ direction: "in", valueUSDC: 5 }), tx({ direction: "out", valueUSDC: 3 })]),
      buildInsight(kundli({ score: 10, txCount: 0 }), []),
    ]
    for (const i of cases) {
      expect(i.action).toBeDefined()
      expect(i.action!.label.length).toBeGreaterThan(0)
      expect(i.action!.href).toMatch(/^\//)
    }
  })
})

describe("relTime", () => {
  const now = new Date("2026-08-02T12:00:00Z").getTime()
  it("handles null and invalid", () => {
    expect(relTime(null, now)).toBe("—")
    expect(relTime("not-a-date", now)).toBe("—")
  })
  it("formats buckets", () => {
    expect(relTime(new Date(now - 30_000).toISOString(), now)).toBe("just now")
    expect(relTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe("5m ago")
    expect(relTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe("3h ago")
    expect(relTime(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe("2d ago")
  })
})

describe("topSignals", () => {
  it("returns at most the requested number, sorted by weight", () => {
    const s = topSignals(kundli({}), [tx({ direction: "in", valueUSDC: 10 })], 3)
    expect(s.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < s.length; i++) expect(s[i - 1].weight).toBeGreaterThanOrEqual(s[i].weight)
  })
  it("never fabricates — every signal is grounded in the data", () => {
    const days = Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: i >= 11 ? 2 : 0 }))
    const s = topSignals(
      kundli({ balanceUSDC: 250, txCount: 12, score: 600, rank: "Steward", percentile: 80, tokenTransfers: 3, activityByDay: days }),
      [tx({ direction: "in", valueUSDC: 10 }), tx({ direction: "out", valueUSDC: 3 }), tx({ direction: "in", valueUSDC: 7 })],
      3,
    )
    const text = s.map((x) => x.headline + " " + x.detail).join("\n")
    expect(text).toMatch(/USDC|streak|days|top|1000|transfer/i)
  })
  it("always returns at least one reading even for an empty wallet", () => {
    const s = topSignals(kundli({ balanceUSDC: 0, txCount: 0, activityByDay: Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: 0 })) }), [], 3)
    expect(s.length).toBeGreaterThanOrEqual(1)
    expect(s[0].action).toBeDefined()
    expect(s[0].action!.href).toMatch(/^\//)
  })
  it("surfaces reliability as caution when sends fail", () => {
    const s = topSignals(
      kundli({}),
      [tx({ direction: "out", status: "error" }), tx({ direction: "out" }), tx({ direction: "out" })],
      3,
    )
    const rel = s.find((x) => x.kind === "reliability")
    expect(rel).toBeDefined()
    expect(rel!.tone).toBe("caution")
    expect(rel!.headline).toMatch(/% of sends/)
  })
})
