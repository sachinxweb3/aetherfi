import { describe, it, expect } from "vitest"
import {
  isValidAddress, normalizeAddress, sameAddress, shortAddr,
  validatePair, buildComparison,
  compareReducer, initialCompareState, isLoading,
  type CompareOutcome,
} from "../lib/compare"
import type { WalletKundli } from "../lib/arc"

// Pure core of the Compare module — address helpers, pair validation, the
// comparison builder over two REAL analyses, and the read lifecycle reducer.
// No React, no network is exercised here (mirrors tests/swap|bridge|oracle).

const kundli = (over: Partial<WalletKundli>): WalletKundli => ({
  address: "0x1111111111111111111111111111111111111111",
  balanceUSDC: 0, txCount: 0, gasUsed: 0, tokenTransfers: 0,
  firstTxDate: null, lastTxDate: null, walletAgeDays: 0, isContract: false,
  score: 0, rank: "—", percentile: 0, badges: [], activityByDay: [],
  ...over,
})

describe("address helpers", () => {
  it("validates 0x… addresses and trims", () => {
    expect(isValidAddress("0x" + "a".repeat(40))).toBe(true)
    expect(isValidAddress("  0x" + "A".repeat(40) + "  ")).toBe(true)
    expect(isValidAddress("0x123")).toBe(false)
    expect(isValidAddress("nope")).toBe(false)
  })

  it("normalizes and compares case-insensitively", () => {
    const a = "0x" + "A".repeat(40)
    const b = "0x" + "a".repeat(40)
    expect(normalizeAddress("  " + a + " ")).toBe(b)
    expect(sameAddress(a, b)).toBe(true)
  })

  it("shortens long addresses only", () => {
    expect(shortAddr("0x1234567890abcdef")).toBe("0x1234…cdef")
    expect(shortAddr("0xabc")).toBe("0xabc")
  })
})

describe("pair validation — never fabricates", () => {
  const A = "0x" + "a".repeat(40)
  const B = "0x" + "b".repeat(40)

  it("is not-ready (not an error) when a field is empty", () => {
    const v = validatePair("", A)
    expect(v.ready).toBe(false)
    expect(v.reason).toMatch(/enter two wallet/i)
  })

  it("rejects malformed addresses", () => {
    const v = validatePair("0x123", A)
    expect(v.ready).toBe(false)
    expect(v.reason).toMatch(/valid 0x/i)
  })

  it("rejects the same wallet twice (case-insensitive)", () => {
    const v = validatePair(A, "0x" + "A".repeat(40))
    expect(v.ready).toBe(false)
    expect(v.reason).toMatch(/two different/i)
  })

  it("is ready for two distinct valid wallets", () => {
    const v = validatePair(A, B)
    expect(v.ready).toBe(true)
    expect(v.reason).toBeNull()
  })
})

describe("buildComparison — every row is a real field, winner by score", () => {
  it("copies real metrics, assigns per-row winners and tallies edges", () => {
    const a = kundli({ score: 800, txCount: 100, balanceUSDC: 50, walletAgeDays: 200, gasUsed: 10, tokenTransfers: 5, percentile: 90 })
    const b = kundli({ address: "0x" + "2".repeat(40), score: 400, txCount: 100, balanceUSDC: 10, walletAgeDays: 50, gasUsed: 99, tokenTransfers: 2, percentile: 40 })
    const r = buildComparison(a, b)

    expect(r.winner).toBe("a") // higher score
    const score = r.metrics.find((m) => m.key === "score")!
    expect(score.a).toBe(800)
    expect(score.b).toBe(400)
    expect(score.winner).toBe("a")

    const tx = r.metrics.find((m) => m.key === "txCount")!
    expect(tx.winner).toBe("tie") // equal
    const gas = r.metrics.find((m) => m.key === "gasUsed")!
    expect(gas.winner).toBe("b")

    expect(r.aEdges + r.bEdges + r.ties).toBe(r.metrics.length)
    expect(r.ties).toBeGreaterThanOrEqual(1)
  })

  it("declares a tie when scores are equal", () => {
    const a = kundli({ score: 500 })
    const b = kundli({ address: "0x" + "3".repeat(40), score: 500 })
    expect(buildComparison(a, b).winner).toBe("tie")
  })

  it("formats standing as Top X% from percentile", () => {
    const a = kundli({ percentile: 97 })
    const b = kundli({ address: "0x" + "4".repeat(40), percentile: 10 })
    const standing = buildComparison(a, b).metrics.find((m) => m.key === "percentile")!
    expect(standing.displayA).toBe("Top 3%")
    expect(standing.winner).toBe("a")
  })
})

describe("compare read lifecycle", () => {
  const a = kundli({ score: 700 })
  const b = kundli({ address: "0x" + "9".repeat(40), score: 300 })
  const ok: CompareOutcome = { status: "ok", a, b }

  it("requests → loading → ready with a real result", () => {
    let s = compareReducer(initialCompareState, { type: "COMPARE_REQUESTED" })
    expect(s.phase).toBe("loading")
    expect(isLoading(s.phase)).toBe(true)
    s = compareReducer(s, { type: "COMPARE_RESULT", outcome: ok })
    expect(s.phase).toBe("ready")
    expect(s.result?.winner).toBe("a")
  })

  it("surfaces unavailable and error outcomes distinctly, with no result", () => {
    const loading = compareReducer(initialCompareState, { type: "COMPARE_REQUESTED" })
    const u = compareReducer(loading, { type: "COMPARE_RESULT", outcome: { status: "unavailable", message: "no data" } })
    expect(u.phase).toBe("unavailable")
    expect(u.result).toBeNull()
    expect(u.message).toBe("no data")
    const e = compareReducer(loading, { type: "COMPARE_RESULT", outcome: { status: "error", message: "boom" } })
    expect(e.phase).toBe("error")
    expect(e.result).toBeNull()
  })

  it("ignores a stale result that arrives outside the loading phase", () => {
    const s = compareReducer(initialCompareState, { type: "COMPARE_RESULT", outcome: ok })
    expect(s).toBe(initialCompareState)
  })

  it("editing an input after a result returns to idle", () => {
    const ready = compareReducer(compareReducer(initialCompareState, { type: "COMPARE_REQUESTED" }), { type: "COMPARE_RESULT", outcome: ok })
    const edited = compareReducer(ready, { type: "INPUT_CHANGED" })
    expect(edited.phase).toBe("idle")
    expect(edited.result).toBeNull()
  })

  it("editing while already idle is a no-op", () => {
    expect(compareReducer(initialCompareState, { type: "INPUT_CHANGED" })).toBe(initialCompareState)
  })

  it("FAILED records a real message, and RESET returns to the start", () => {
    const failed = compareReducer(initialCompareState, { type: "FAILED", message: "network down" })
    expect(failed.phase).toBe("error")
    expect(failed.message).toBe("network down")
    expect(compareReducer(failed, { type: "RESET" })).toEqual(initialCompareState)
  })
})
