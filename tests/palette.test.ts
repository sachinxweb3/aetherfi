import { describe, it, expect } from "vitest"
import { fuzzyScore, filterActions, PALETTE_ACTIONS } from "../lib/palette"

// Palette ranking is pure — fuzzy subsequence match with prefix/word-boundary
// boosts, plus transfer-command interception via lib/command.

describe("fuzzyScore", () => {
  it("returns 0 for an empty query", () => {
    expect(fuzzyScore("", "Dashboard")).toBe(0)
  })

  it("matches a subsequence in order", () => {
    expect(fuzzyScore("dsh", "Dashboard")).not.toBeNull()
  })

  it("rejects chars not present in order", () => {
    expect(fuzzyScore("zzz", "Dashboard")).toBeNull()
    expect(fuzzyScore("rdh", "Dashboard")).toBeNull() // r,d,h — d and h come after r? no: 'r' at end; 'd' before it; need r THEN d: d is before r → fails
    expect(fuzzyScore("bdh", "Dashboard")).toBeNull() // b then d then h — but d comes before b → fails
  })

  it("scores an exact match best, then prefix", () => {
    const exact = fuzzyScore("dashboard", "Dashboard")!
    const prefix = fuzzyScore("dash", "Dashboard")!
    const loose = fuzzyScore("dbd", "Dashboard")!
    expect(exact).toBeLessThan(prefix)
    expect(prefix).toBeLessThan(loose)
  })
})

describe("filterActions", () => {
  it("returns the full registry in default order for an empty query", () => {
    const r = filterActions("")
    expect(r.length).toBe(PALETTE_ACTIONS.length)
    expect(r[0].id).toBe("nav-dashboard")
  })

  it("ranks a prefix hit to the top", () => {
    const r = filterActions("port")
    expect(r[0].label).toBe("Portfolio")
  })

  it("matches via keywords, not just labels", () => {
    const r = filterActions("holdings")
    expect(r[0].label).toBe("Portfolio")
  })

  it("finds analytics via a fuzzy subsequence", () => {
    const r = filterActions("anly")
    expect(r.some((a) => a.label === "Analytics")).toBe(true)
  })

  it("returns nothing for a query that matches no action", () => {
    expect(filterActions("qqqqzzz").length).toBe(0)
  })

  it("intercepts a transfer command as a live action", () => {
    const r = filterActions("send 5 to 0x1111111111111111111111111111111111111111")
    expect(r[0].kind).toBe("transfer")
    expect(r[0].href).toContain("/transfer?to=")
    expect(r[0].href).toContain("amount=5")
  })
})
