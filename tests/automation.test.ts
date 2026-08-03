import { describe, it, expect } from "vitest"
import {
  validateRule,
  nextDueAt,
  ruleState,
  isDue,
  runHref,
  describeRule,
  createRule,
  sortRules,
  dueCount,
  storageKey,
  isAutomationKey,
  type AutomationRule,
  type RuleDraft,
} from "../lib/automation"

// Scheduled recurring-payment rules (File 02). Every schedule calculation is
// pure and time-injected, so "when is this next due" is deterministic. Rules
// never auto-send — they hand off to /transfer for the user to sign (File 16).

const NOW = Date.parse("2026-08-02T12:00:00Z")
const ADDR = "0x1111111111111111111111111111111111111111"

const draft = (over: Partial<RuleDraft> = {}): RuleDraft => ({
  label: "Rent",
  to: ADDR,
  amount: "5",
  cadence: "monthly",
  startAt: "2026-08-01T12:00:00Z",
  ...over,
})

const rule = (over: Partial<AutomationRule> = {}): AutomationRule => ({
  ...createRule(draft(), "r1", "2026-07-01T00:00:00Z"),
  ...over,
})

describe("validateRule", () => {
  it("accepts a real address, positive amount, and valid start", () => {
    expect(validateRule(draft()).ready).toBe(true)
  })
  it("rejects a bad address", () => {
    const v = validateRule(draft({ to: "0xnope" }))
    expect(v.toValid).toBe(false)
    expect(v.ready).toBe(false)
  })
  it("rejects zero / negative amounts", () => {
    expect(validateRule(draft({ amount: "0" })).amtValid).toBe(false)
    expect(validateRule(draft({ amount: "-3" })).amtValid).toBe(false)
  })
  it("rejects an unparseable start date", () => {
    expect(validateRule(draft({ startAt: "not-a-date" })).startValid).toBe(false)
  })
})

describe("nextDueAt — one time", () => {
  it("returns the start moment when unspent", () => {
    const r = rule({ cadence: "once", startAt: "2026-08-10T00:00:00Z", lastRunAt: null })
    expect(nextDueAt(r, NOW)).toBe(Date.parse("2026-08-10T00:00:00Z"))
  })
  it("returns null once it has run", () => {
    const r = rule({ cadence: "once", lastRunAt: "2026-08-01T12:05:00Z" })
    expect(nextDueAt(r, NOW)).toBeNull()
    expect(ruleState(r, NOW)).toBe("done")
  })
})

describe("nextDueAt — daily/weekly catch-up", () => {
  it("daily rolls forward past all missed days to the next future slot", () => {
    const r = rule({ cadence: "daily", startAt: "2026-07-01T12:00:00Z", lastRunAt: null })
    const next = nextDueAt(r, NOW)!
    expect(next).toBeGreaterThanOrEqual(NOW)
    // Aligned to the daily grid from start.
    expect((next - Date.parse("2026-07-01T12:00:00Z")) % 86_400_000).toBe(0)
  })
  it("weekly steps one interval past the last run", () => {
    const r = rule({ cadence: "weekly", startAt: "2026-07-01T12:00:00Z", lastRunAt: "2026-07-29T12:00:00Z" })
    expect(nextDueAt(r, NOW)).toBe(Date.parse("2026-08-05T12:00:00Z"))
  })
})

describe("nextDueAt — monthly clamps short months", () => {
  it("Jan 31 start lands on Feb 28, not March", () => {
    const r = rule({ cadence: "monthly", startAt: "2026-01-31T00:00:00Z", lastRunAt: "2026-01-31T00:00:00Z" })
    const next = nextDueAt(r, Date.parse("2026-02-01T00:00:00Z"))!
    expect(new Date(next).toISOString().slice(0, 10)).toBe("2026-02-28")
  })
})

describe("ruleState / isDue", () => {
  it("is due when the start is in the past and unrun", () => {
    const r = rule({ cadence: "once", startAt: "2026-08-01T00:00:00Z", lastRunAt: null })
    expect(isDue(r, NOW)).toBe(true)
    expect(ruleState(r, NOW)).toBe("due")
  })
  it("is scheduled when the next occurrence is in the future", () => {
    const r = rule({ cadence: "once", startAt: "2026-09-01T00:00:00Z", lastRunAt: null })
    expect(ruleState(r, NOW)).toBe("scheduled")
  })
  it("is paused when disabled regardless of timing", () => {
    const r = rule({ enabled: false, startAt: "2026-08-01T00:00:00Z" })
    expect(ruleState(r, NOW)).toBe("paused")
    expect(isDue(r, NOW)).toBe(false)
  })
})

describe("runHref / describeRule", () => {
  it("deep-links into the transfer flow with recipient + amount", () => {
    expect(runHref(rule({ to: ADDR, amount: "5" }))).toBe(`/transfer?to=${ADDR}&amount=5`)
  })
  it("summarizes cadence in plain language", () => {
    expect(describeRule(rule({ amount: "5", cadence: "weekly" }))).toBe("5 USDC · every 7 days")
  })
})

describe("createRule", () => {
  it("assigns system fields deterministically and defaults a blank label", () => {
    const r = createRule(draft({ label: "" }), "abc", "2026-07-01T00:00:00Z")
    expect(r.id).toBe("abc")
    expect(r.label).toBe("Payment")
    expect(r.enabled).toBe(true)
    expect(r.lastRunAt).toBeNull()
    expect(r.createdAt).toBe("2026-07-01T00:00:00Z")
  })
})

describe("sortRules / dueCount", () => {
  const due = rule({ id: "due", cadence: "once", startAt: "2026-08-01T00:00:00Z", lastRunAt: null })
  const soon = rule({ id: "soon", cadence: "once", startAt: "2026-08-03T00:00:00Z", lastRunAt: null })
  const paused = rule({ id: "paused", enabled: false })
  const done = rule({ id: "done", cadence: "once", lastRunAt: "2026-08-01T12:05:00Z" })

  it("orders due → scheduled → paused → done", () => {
    const ids = sortRules([done, paused, soon, due], NOW).map((r) => r.id)
    expect(ids).toEqual(["due", "soon", "paused", "done"])
  })
  it("counts only rules owing a payment now", () => {
    expect(dueCount([due, soon, paused, done], NOW)).toBe(1)
  })
})

describe("persistence keys", () => {
  it("namespaces per lowercased address and recognizes its own keys", () => {
    const k = storageKey("0xABCDEF0000000000000000000000000000000000")
    expect(k).toBe("aether.automation.0xabcdef0000000000000000000000000000000000")
    expect(isAutomationKey(k)).toBe(true)
    expect(isAutomationKey("aether.portfolio.snap.x")).toBe(false)
  })
})
