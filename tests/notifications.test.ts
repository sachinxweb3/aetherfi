import { describe, it, expect } from "vitest"
import {
  buildNotifications,
  resolve,
  unreadCount,
  markAllRead,
  markRead,
  dismiss,
  dismissAll,
  prune,
  storageKey,
  isNotifKey,
  EMPTY_STATE,
  type NotifInput,
  type NotifState,
} from "../lib/notifications"
import { createRule, type AutomationRule, type RuleDraft } from "../lib/automation"
import type { WalletKundli, ArcTx } from "../lib/arc"

// Notifications are DERIVED from real facts (File 06/16): every alert id is
// tied to a tx hash / rule id / rank threshold, so the same inputs always yield
// the same ids and read/dismissed state stays attached. All time-injected.

const NOW = Date.parse("2026-08-02T12:00:00Z")
const ADDR = "0x1111111111111111111111111111111111111111"

const kundli = (over: Partial<WalletKundli> = {}): WalletKundli => ({
  address: ADDR,
  balanceUSDC: 500,
  txCount: 40,
  gasUsed: 0,
  tokenTransfers: 0,
  firstTxDate: null,
  lastTxDate: null,
  walletAgeDays: 30,
  isContract: false,
  score: 300,
  rank: "Explorer",
  percentile: 50,
  badges: [],
  activityByDay: [],
  ...over,
})

const tx = (over: Partial<ArcTx> = {}): ArcTx => ({
  hash: "0xabc",
  timestamp: "2026-08-02T10:00:00Z",
  from: "0x2222222222222222222222222222222222222222",
  to: ADDR,
  direction: "in",
  valueUSDC: 10,
  feeUSDC: 0,
  status: "ok",
  method: null,
  blockNumber: 1,
  ...over,
})

const ruleDraft = (over: Partial<RuleDraft> = {}): RuleDraft => ({
  label: "Rent",
  to: ADDR,
  amount: "5",
  cadence: "monthly",
  startAt: "2026-08-01T12:00:00Z",
  ...over,
})

const rule = (over: Partial<AutomationRule> = {}): AutomationRule => ({
  ...createRule(ruleDraft(), "r1", "2026-07-01T00:00:00Z"),
  ...over,
})

const input = (over: Partial<NotifInput> = {}): NotifInput => ({
  kundli: kundli(),
  txs: [],
  rules: [],
  ...over,
})

describe("buildNotifications — derivation", () => {
  it("emits a due-automation alert with a stable per-rule id", () => {
    const r = rule({ id: "rent", cadence: "once", startAt: "2026-08-01T00:00:00Z", lastRunAt: null })
    const ns = buildNotifications(input({ rules: [r] }), NOW)
    const a = ns.find((n) => n.kind === "automation")
    expect(a?.id).toBe("af:automation:rent")
    expect(a?.tone).toBe("caution")
    expect(a?.href).toBe("/automation")
  })

  it("does not alert for a scheduled (not-yet-due) rule", () => {
    const r = rule({ cadence: "once", startAt: "2026-09-01T00:00:00Z", lastRunAt: null })
    const ns = buildNotifications(input({ rules: [r] }), NOW)
    expect(ns.some((n) => n.kind === "automation")).toBe(false)
  })

  it("flags failed transactions by hash", () => {
    const ns = buildNotifications(input({ txs: [tx({ hash: "0xf1", status: "error" })] }), NOW)
    const f = ns.find((n) => n.id === "af:tx-failed:0xf1")
    expect(f).toBeTruthy()
    expect(f?.tone).toBe("caution")
  })

  it("surfaces recent receipts but caps the count", () => {
    const many = Array.from({ length: 8 }, (_, i) => tx({ hash: `0xr${i}`, direction: "in", valueUSDC: 3 }))
    const ns = buildNotifications(input({ txs: many }), NOW)
    expect(ns.filter((n) => n.id.startsWith("af:rx:")).length).toBe(4)
  })

  it("ignores zero-value and outbound transfers for receipts", () => {
    const ns = buildNotifications(
      input({ txs: [tx({ hash: "0xz", valueUSDC: 0 }), tx({ hash: "0xo", direction: "out", valueUSDC: 9 })] }),
      NOW,
    )
    expect(ns.some((n) => n.id.startsWith("af:rx:"))).toBe(false)
  })

  it("alerts to fund an empty wallet", () => {
    const ns = buildNotifications(input({ kundli: kundli({ balanceUSDC: 0 }) }), NOW)
    expect(ns.some((n) => n.id === "af:funding")).toBe(true)
  })

  it("nudges rank only when within reach of the next tier", () => {
    const near = buildNotifications(input({ kundli: kundli({ score: 380 }) }), NOW) // 20 to Active Builder (400)
    expect(near.some((n) => n.kind === "rank")).toBe(true)
    const far = buildNotifications(input({ kundli: kundli({ score: 300 }) }), NOW) // 100 away
    expect(far.some((n) => n.kind === "rank")).toBe(false)
  })

  it("orders caution before positive/neutral", () => {
    const r = rule({ id: "due", cadence: "once", startAt: "2026-08-01T00:00:00Z", lastRunAt: null })
    const ns = buildNotifications(input({ rules: [r], txs: [tx({ hash: "0xrx", valueUSDC: 5 })] }), NOW)
    expect(ns[0].tone).toBe("caution")
  })

  it("tolerates a null kundli (pre-load)", () => {
    const ns = buildNotifications(input({ kundli: null, txs: [tx({ hash: "0xf", status: "error" })] }), NOW)
    expect(ns.length).toBe(1)
  })

  it("is deterministic — same inputs, same ids", () => {
    const inp = input({ txs: [tx({ hash: "0xd", status: "error" })] })
    const a = buildNotifications(inp, NOW).map((n) => n.id)
    const b = buildNotifications(inp, NOW).map((n) => n.id)
    expect(a).toEqual(b)
  })
})

describe("resolve / unreadCount / read", () => {
  const notifs = buildNotifications(
    input({ txs: [tx({ hash: "0x1", status: "error" }), tx({ hash: "0x2", valueUSDC: 4 })] }),
    NOW,
  )

  it("all notifications start unread", () => {
    expect(unreadCount(notifs, EMPTY_STATE)).toBe(notifs.length)
    expect(resolve(notifs, EMPTY_STATE).every((n) => !n.read)).toBe(true)
  })

  it("markRead flips a single id and is idempotent", () => {
    const id = notifs[0].id
    const s1 = markRead(EMPTY_STATE, id)
    const s2 = markRead(s1, id)
    expect(s1.read).toEqual([id])
    expect(s2).toBe(s1) // no-op returns same reference
    expect(unreadCount(notifs, s1)).toBe(notifs.length - 1)
  })

  it("markAllRead zeroes the unread count", () => {
    const s = markAllRead(notifs, EMPTY_STATE)
    expect(unreadCount(notifs, s)).toBe(0)
  })
})

describe("dismiss", () => {
  const notifs = buildNotifications(input({ txs: [tx({ hash: "0x1", status: "error" }), tx({ hash: "0x2", valueUSDC: 4 })] }), NOW)

  it("removes a notification from the resolved list", () => {
    const id = notifs[0].id
    const s = dismiss(EMPTY_STATE, id)
    expect(resolve(notifs, s).some((n) => n.id === id)).toBe(false)
  })

  it("dismissAll clears the whole visible list", () => {
    const s = dismissAll(notifs, EMPTY_STATE)
    expect(resolve(notifs, s).length).toBe(0)
  })
})

describe("prune", () => {
  it("drops read/dismissed ids no longer backed by a live fact", () => {
    const state: NotifState = { read: ["af:tx-failed:gone", "af:funding"], dismissed: ["af:rx:old"] }
    const pruned = prune(state, ["af:funding"])
    expect(pruned.read).toEqual(["af:funding"])
    expect(pruned.dismissed).toEqual([])
  })
})

describe("persistence keys", () => {
  it("namespaces per lowercased address and recognizes its own keys", () => {
    const k = storageKey("0xABCDEF0000000000000000000000000000000000")
    expect(k).toBe("aether.notif.0xabcdef0000000000000000000000000000000000")
    expect(isNotifKey(k)).toBe(true)
    expect(isNotifKey("aether.automation.0xabc")).toBe(false)
  })
})
