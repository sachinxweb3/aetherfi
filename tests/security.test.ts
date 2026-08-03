import { describe, it, expect } from "vitest"
import {
  securityChecks,
  securityReport,
  overallScore,
  securityGrade,
  type SecurityInput,
} from "../lib/security"
import type { ArcTx } from "../lib/arc"

// Deterministic wallet security checkup over real on-chain data (File 06 / 16).
// Every finding is derived from the input — nothing fabricated. Time is
// injected so dormancy is stable.

const NOW = Date.parse("2026-08-02T12:00:00Z")

const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0xabc",
  timestamp: "2026-08-01T12:00:00Z",
  from: "0xme",
  to: "0xother",
  direction: "out",
  valueUSDC: 10,
  feeUSDC: 0.01,
  status: "ok",
  method: null,
  blockNumber: 1,
  ...over,
})

const input = (over: Partial<SecurityInput>): SecurityInput => ({
  address: "0xme",
  walletAgeDays: 45,
  isContract: false,
  lastTxDate: "2026-08-01T12:00:00Z",
  txs: [
    tx({ to: "0xalice", valueUSDC: 10 }),
    tx({ to: "0xbob", valueUSDC: 8 }),
    tx({ direction: "in", from: "0xother", to: "0xme", valueUSDC: 20 }),
  ],
  ...over,
})

const byId = (i: SecurityInput) => {
  const map = new Map(securityChecks(i, NOW).map((c) => [c.id, c]))
  return (id: string) => map.get(id)!
}

describe("approval exposure", () => {
  it("passes with no approval calls", () => {
    const c = byId(input({}))("approvals")
    expect(c.status).toBe("pass")
    expect(c.score).toBe(1)
  })

  it("warns when approval calls are present and never claims the amount", () => {
    const c = byId(input({ txs: [tx({ method: "approve" }), tx({ method: "increaseAllowance" })] }))("approvals")
    expect(c.status).toBe("warn")
    expect(c.detail.toLowerCase()).toContain("can't be read")
  })

  it("escalates severity as approval count grows", () => {
    const few = byId(input({ txs: [tx({ method: "approve" })] }))("approvals")
    const many = byId(input({ txs: [tx({ method: "approve" }), tx({ method: "approve" }), tx({ method: "approve" })] }))("approvals")
    expect(many.score).toBeLessThan(few.score)
  })
})

describe("transaction hygiene", () => {
  it("fails on a low success rate", () => {
    const txs = [tx({ status: "error" }), tx({ status: "error" }), tx({ status: "ok" })]
    expect(byId(input({ txs }))("hygiene").status).toBe("fail")
  })

  it("is informational with no transactions", () => {
    const c = byId(input({ txs: [] }))("hygiene")
    expect(c.status).toBe("info")
    expect(c.weight).toBe(0)
  })
})

describe("dormancy", () => {
  it("passes for a recently active wallet", () => {
    expect(byId(input({}))("dormancy").status).toBe("pass")
  })

  it("warns for a long-dormant wallet", () => {
    const c = byId(input({ lastTxDate: "2026-01-01T12:00:00Z" }))("dormancy")
    expect(c.status).toBe("warn")
    expect(c.detail).toMatch(/dormant/i)
  })
})

describe("outflow concentration", () => {
  it("warns when most outgoing value goes to one address", () => {
    const txs = [
      tx({ to: "0xdrain", valueUSDC: 100 }),
      tx({ to: "0xdrain", valueUSDC: 100 }),
      tx({ to: "0xelse", valueUSDC: 5 }),
    ]
    expect(byId(input({ txs }))("concentration").status).toBe("warn")
  })

  it("is informational when there is no outgoing value", () => {
    const txs = [tx({ direction: "in", from: "0xo", to: "0xme", valueUSDC: 50 })]
    expect(byId(input({ txs }))("concentration").weight).toBe(0)
  })
})

describe("overall score & report", () => {
  it("ignores informational checks in the weighted score", () => {
    const checks = securityChecks(input({}), NOW)
    const info = checks.filter((c) => c.weight === 0)
    expect(info.length).toBeGreaterThan(0)
    expect(overallScore(checks)).toBeGreaterThan(0)
  })

  it("a clean wallet scores Strong", () => {
    const r = securityReport(input({}), NOW)
    expect(r.score).toBeGreaterThanOrEqual(85)
    expect(r.grade).toBe("Strong")
    expect(r.summary).toMatch(/no security concerns/i)
  })

  it("a risky wallet scores lower and reports issues", () => {
    const risky = input({
      txs: [tx({ method: "approve", status: "error" }), tx({ status: "error" })],
      lastTxDate: "2026-01-01T12:00:00Z",
      walletAgeDays: 3,
    })
    const r = securityReport(risky, NOW)
    expect(r.score).toBeLessThan(65)
    expect(r.summary).toMatch(/worth reviewing/i)
  })

  it("orders most urgent findings first", () => {
    const risky = input({ txs: [tx({ status: "error" }), tx({ status: "error" })] })
    const checks = securityChecks(risky, NOW)
    const firstScored = checks.find((c) => c.weight > 0)!
    expect(["fail", "warn"]).toContain(firstScored.status)
  })

  it("handles an empty wallet honestly", () => {
    const r = securityReport(input({ txs: [], lastTxDate: null, walletAgeDays: 0 }), NOW)
    expect(r.summary).toMatch(/not enough/i)
  })

  it("grades map to the documented bands", () => {
    expect(securityGrade(90)).toBe("Strong")
    expect(securityGrade(70)).toBe("Fair")
    expect(securityGrade(50)).toBe("Needs attention")
    expect(securityGrade(10)).toBe("At risk")
  })
})
