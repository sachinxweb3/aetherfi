import { describe, it, expect } from "vitest"
import { fmtUSDC, fmtInt } from "../app/(app)/dashboard/page"

// Dashboard KPI formatters — deterministic display logic (File 12 unit coverage).
describe("dashboard formatters", () => {
  it("formats USDC with thousands separators and a unit", () => {
    expect(fmtUSDC(0)).toBe("0 USDC")
    expect(fmtUSDC(1234.5)).toBe("1,234.5 USDC")
    expect(fmtUSDC(1000000)).toBe("1,000,000 USDC")
  })

  it("caps USDC to 2 decimal places", () => {
    expect(fmtUSDC(1.239)).toBe("1.24 USDC")
  })

  it("formats integers with separators", () => {
    expect(fmtInt(0)).toBe("0")
    expect(fmtInt(42)).toBe("42")
    expect(fmtInt(1234567)).toBe("1,234,567")
  })
})
