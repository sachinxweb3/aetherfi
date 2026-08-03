import { describe, it, expect } from "vitest"
import {
  relativeTime, methodLabel, signedAmount,
  filterActivity, filterCounts, dayLabel, groupByDay,
} from "../lib/activity"
import type { ArcTx } from "../lib/arc"

// Activity display helpers — deterministic formatting (File 05 history, File 12).
const NOW = new Date("2026-08-02T12:00:00Z").getTime()

describe("relativeTime", () => {
  it("buckets recent times", () => {
    expect(relativeTime(new Date(NOW - 10_000).toISOString(), NOW)).toBe("just now")
    expect(relativeTime(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("5m ago")
    expect(relativeTime(new Date(NOW - 3 * 3_600_000).toISOString(), NOW)).toBe("3h ago")
    expect(relativeTime(new Date(NOW - 2 * 86_400_000).toISOString(), NOW)).toBe("2d ago")
  })
  it("falls back to a date for older tx and handles nulls", () => {
    expect(relativeTime(new Date(NOW - 30 * 86_400_000).toISOString(), NOW)).toBe("2026-07-03")
    expect(relativeTime(null)).toBe("—")
    expect(relativeTime("not-a-date")).toBe("—")
  })
})

describe("methodLabel", () => {
  it("prefers a decoded method, title-cased", () => {
    expect(methodLabel({ method: "transfer", direction: "out" })).toBe("Transfer")
    expect(methodLabel({ method: "swapExactTokens", direction: "out" })).toBe("Swap Exact Tokens")
    expect(methodLabel({ method: "add_liquidity", direction: "in" })).toBe("Add liquidity")
  })
  it("infers from direction when no method", () => {
    expect(methodLabel({ method: null, direction: "in" })).toBe("Received")
    expect(methodLabel({ method: "", direction: "out" })).toBe("Sent")
    expect(methodLabel({ method: null, direction: "self" })).toBe("Self transfer")
  })
})

describe("signedAmount", () => {
  it("signs by direction", () => {
    expect(signedAmount({ direction: "out", valueUSDC: 12.5 })).toBe("−12.5 USDC")
    expect(signedAmount({ direction: "in", valueUSDC: 3 })).toBe("+3 USDC")
    expect(signedAmount({ direction: "self", valueUSDC: 1 })).toBe("1 USDC")
    expect(signedAmount({ direction: "out", valueUSDC: 0 })).toBe("0 USDC")
  })
})

// ── Timeline helpers ────────────────────────────────────────────────────────

const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "out",
  valueUSDC: 1, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})

describe("filterActivity", () => {
  const txs: ArcTx[] = [
    tx({ direction: "in", valueUSDC: 10 }),
    tx({ direction: "out", valueUSDC: 5 }),
    tx({ direction: "out", valueUSDC: 2, status: "error" }),
    tx({ direction: "self", valueUSDC: 1 }),
  ]
  it("returns all for 'all'", () => expect(filterActivity(txs, "all").length).toBe(4))
  it("filters by direction", () => expect(filterActivity(txs, "in").length).toBe(1))
  it("filters failed across directions", () => expect(filterActivity(txs, "failed").length).toBe(1))
})

describe("filterCounts", () => {
  it("returns per-filter badge counts", () => {
    const c = filterCounts([tx({ direction: "in" }), tx({ direction: "in" }), tx({ direction: "out", status: "error" })])
    expect(c).toEqual({ all: 3, in: 2, out: 1, failed: 1 })
  })
})

describe("dayLabel", () => {
  // Local-time timestamps (no trailing Z) so day-boundary math is independent
  // of the test runner's timezone — the function groups by the user's LOCAL day.
  const now = new Date(2026, 7, 2, 12, 0, 0).getTime() // Aug 2 2026, local noon
  it("labels today and yesterday", () => {
    expect(dayLabel("2026-08-02T10:00:00", now)).toBe("Today")
    expect(dayLabel("2026-08-01T09:00:00", now)).toBe("Yesterday")
  })
  it("labels a recent date without year", () => {
    expect(dayLabel("2026-07-31T08:00:00", now)).toBe("Jul 31")
  })
  it("includes year on older dates", () => {
    expect(dayLabel("2024-11-01T08:00:00", now)).toBe("Nov 1, 2024")
  })
  it("handles null and garbage", () => {
    expect(dayLabel(null, now)).toBe("Unknown date")
    expect(dayLabel("not-a-date", now)).toBe("Unknown date")
  })
})

describe("groupByDay", () => {
  const now = new Date(2026, 7, 2, 12, 0, 0).getTime()
  it("groups into day buckets, newest first, and rolls up totals", () => {
    const days = groupByDay(
      [
        tx({ timestamp: "2026-08-02T10:00:00", direction: "in", valueUSDC: 8 }),
        tx({ timestamp: "2026-08-02T11:00:00", direction: "out", valueUSDC: 3 }),
        tx({ timestamp: "2026-07-31T14:00:00", direction: "in", valueUSDC: 5 }),
      ],
      now,
    )
    expect(days.length).toBe(2)
    expect(days[0].key).toBe("2026-08-02")
    expect(days[0].label).toBe("Today")
    expect(days[0].count).toBe(2)
    expect(days[0].inUSDC).toBeCloseTo(8)
    expect(days[0].outUSDC).toBeCloseTo(3)
    expect(days[1].key).toBe("2026-07-31")
  })
  it("excludes failed tx values from day totals", () => {
    const days = groupByDay([tx({ timestamp: "2026-08-02T10:00:00", direction: "out", valueUSDC: 10, status: "error" })], now)
    expect(days[0].outUSDC).toBe(0)
  })
  it("sends undated transactions to a trailing 'Unknown date' group", () => {
    const days = groupByDay([tx({ timestamp: null })], now)
    expect(days.length).toBe(1)
    expect(days[0].key).toBe("unknown")
    expect(days[0].label).toBe("Unknown date")
  })
})
