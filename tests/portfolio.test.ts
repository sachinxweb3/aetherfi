import { describe, it, expect } from "vitest"
import {
  fmtAmount, tokenInitials, sortHoldings, assetCount,
  allocation, topShare, fmtShare, balanceDelta,
} from "../lib/portfolio"
import type { Holding } from "../lib/arc"

// Portfolio display helpers — deterministic formatting (File 04, File 12).
const mk = (over: Partial<Holding>): Holding => ({
  symbol: "TKN", name: "Token", amount: 1, decimals: 18, isNative: false, contract: "0xabc", ...over,
})

describe("fmtAmount", () => {
  it("uses more precision for small amounts", () => {
    expect(fmtAmount(0)).toBe("0")
    expect(fmtAmount(0.123456789)).toBe("0.123457")
    expect(fmtAmount(1234.56789)).toBe("1,234.5679")
  })
  it("guards against non-finite", () => {
    expect(fmtAmount(Infinity)).toBe("0")
    expect(fmtAmount(NaN)).toBe("0")
  })
})

describe("tokenInitials", () => {
  it("takes up to two alphanumerics, uppercased", () => {
    expect(tokenInitials("usdc")).toBe("US")
    expect(tokenInitials("wETH")).toBe("WE")
    expect(tokenInitials("$")).toBe("?")
    expect(tokenInitials("")).toBe("?")
  })
})

describe("sortHoldings", () => {
  it("puts native first, then by descending amount", () => {
    const list = [
      mk({ symbol: "A", amount: 5 }),
      mk({ symbol: "USDC", isNative: true, amount: 0.1, contract: null }),
      mk({ symbol: "B", amount: 50 }),
    ]
    expect(sortHoldings(list).map((h) => h.symbol)).toEqual(["USDC", "B", "A"])
  })
  it("does not mutate the input", () => {
    const list = [mk({ symbol: "A", amount: 1 }), mk({ symbol: "B", amount: 2 })]
    const copy = [...list]
    sortHoldings(list)
    expect(list).toEqual(copy)
  })
})

describe("assetCount", () => {
  it("counts only positive holdings", () => {
    expect(assetCount([mk({ amount: 1 }), mk({ amount: 0 }), mk({ amount: 3 })])).toBe(2)
  })
})

describe("allocation", () => {
  it("computes shares by token amount, native first, excluding zero", () => {
    const rows = allocation([
      mk({ symbol: "A", amount: 30 }),
      mk({ symbol: "USDC", isNative: true, amount: 60, contract: null }),
      mk({ symbol: "Z", amount: 0 }),
      mk({ symbol: "B", amount: 10 }),
    ])
    expect(rows.map((r) => r.symbol)).toEqual(["USDC", "A", "B"])
    expect(rows.map((r) => r.share)).toEqual([0.6, 0.3, 0.1])
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1)
  })
  it("returns empty when nothing is held", () => {
    expect(allocation([mk({ amount: 0 })])).toEqual([])
  })
})

describe("topShare", () => {
  it("returns the largest single share", () => {
    expect(topShare([mk({ amount: 75 }), mk({ amount: 25 })])).toBeCloseTo(0.75)
  })
  it("is zero for an empty portfolio", () => {
    expect(topShare([])).toBe(0)
  })
})

describe("fmtShare", () => {
  it("formats percentages with a dust floor", () => {
    expect(fmtShare(0)).toBe("0%")
    expect(fmtShare(0.5)).toBe("50%")
    expect(fmtShare(0.1234)).toBe("12.3%")
    expect(fmtShare(0.0005)).toBe("<0.1%")
    expect(fmtShare(NaN)).toBe("0%")
  })
})

describe("balanceDelta", () => {
  it("returns null with no prior snapshot (never fakes a trend)", () => {
    expect(balanceDelta(null, 100, 1000)).toBeNull()
  })
  it("computes signed delta, percent, and elapsed time", () => {
    const d = balanceDelta({ nativeUSDC: 80, at: 1000 }, 100, 5000)
    expect(d?.delta).toBeCloseTo(20)
    expect(d?.pct).toBeCloseTo(25)
    expect(d?.sinceMs).toBe(4000)
  })
  it("guards divide-by-zero when previous balance was zero", () => {
    const d = balanceDelta({ nativeUSDC: 0, at: 0 }, 5, 10)
    expect(d?.delta).toBeCloseTo(5)
    expect(d?.pct).toBe(0)
  })
})
