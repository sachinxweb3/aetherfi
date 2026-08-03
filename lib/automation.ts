import { isValidAmount, isValidRecipient } from "@/lib/transfer"

// Automation — scheduled, recurring payment rules (File 02 Core Module).
// AETHER never signs and runs no background jobs, so a rule is an honest
// *scheduled intent*: it tells you when a payment is due and hands the exact
// recipient + amount to the transfer flow for you to review and sign yourself
// (File 16 honesty, File 07 confirm-before-acting). Pure + serializable — no
// React, no DOM — so the scheduling math is unit-tested in isolation and the
// view/persistence layers stay thin.

export type Cadence = "once" | "daily" | "weekly" | "monthly"

export const CADENCES: { value: Cadence; label: string; every: string }[] = [
  { value: "once", label: "One time", every: "once" },
  { value: "daily", label: "Daily", every: "every day" },
  { value: "weekly", label: "Weekly", every: "every 7 days" },
  { value: "monthly", label: "Monthly", every: "every month" },
]

export interface AutomationRule {
  id: string
  label: string // human name, e.g. "Rent" — optional but encouraged
  to: string // 0x recipient
  amount: string // USDC, decimal string (kept as string like TransferForm)
  cadence: Cadence
  startAt: string // ISO date the schedule begins
  lastRunAt: string | null // ISO of the last time the user marked it sent
  enabled: boolean
  createdAt: string // ISO
}

// A draft is everything needed to create a rule, minus system-assigned fields.
export interface RuleDraft {
  label: string
  to: string
  amount: string
  cadence: Cadence
  startAt: string
}

export interface RuleValidation {
  toValid: boolean
  amtValid: boolean
  startValid: boolean
  ready: boolean
}

const DAY = 86_400_000

// Validate a draft using the SAME primitives the live transfer path trusts, so
// a scheduled payment can never encode a recipient/amount the wallet would
// reject (File 09 typed contracts, File 11 transaction safety).
export function validateRule(draft: RuleDraft): RuleValidation {
  const toValid = isValidRecipient(draft.to)
  const amtValid = isValidAmount(draft.amount)
  const startValid = Number.isFinite(Date.parse(draft.startAt))
  return { toValid, amtValid, startValid, ready: toValid && amtValid && startValid }
}

// Advance a monthly anchor by N months, clamping to the month's last day so
// Jan 31 → Feb 28 rather than rolling into March (deterministic, timezone-safe
// via UTC).
function addMonthsUTC(ms: number, months: number): number {
  const d = new Date(ms)
  const day = d.getUTCDate()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.getTime()
}

// The next moment this rule is due at/after `nowMs`. Returns null for a spent
// one-time rule (already run). Pure and deterministic for a given `nowMs`.
export function nextDueAt(rule: AutomationRule, nowMs: number = Date.now()): number | null {
  const start = Date.parse(rule.startAt)
  if (!Number.isFinite(start)) return null

  if (rule.cadence === "once") {
    if (rule.lastRunAt) return null // fired already
    return start
  }

  // Recurring: walk forward from the anchor (last run, or start) until we reach
  // the first occurrence that is still in the future relative to now.
  const anchor = rule.lastRunAt ? Date.parse(rule.lastRunAt) : start
  const base = Number.isFinite(anchor) ? anchor : start

  if (rule.cadence === "monthly") {
    let due = base
    // If anchored on a past run, step at least one interval past it.
    if (rule.lastRunAt) due = addMonthsUTC(due, 1)
    let guard = 0
    while (due < nowMs && guard++ < 1200) due = addMonthsUTC(due, 1)
    return due
  }

  const step = rule.cadence === "daily" ? DAY : DAY * 7
  let due = rule.lastRunAt ? base + step : base
  if (due < nowMs) {
    const missed = Math.ceil((nowMs - due) / step)
    due += missed * step
  }
  return due
}

export type RuleState = "due" | "scheduled" | "paused" | "done"

// The rule's status for display + sorting. `due` means it's payable now.
export function ruleState(rule: AutomationRule, nowMs: number = Date.now()): RuleState {
  if (!rule.enabled) return "paused"
  const next = nextDueAt(rule, nowMs)
  if (next === null) return "done"
  return next <= nowMs ? "due" : "scheduled"
}

// Is a payment currently owed for this rule?
export function isDue(rule: AutomationRule, nowMs: number = Date.now()): boolean {
  return ruleState(rule, nowMs) === "due"
}

// Deep link into the existing transfer flow, pre-filled with this rule's real
// recipient + amount. The user still reviews and signs (never auto-sent).
export function runHref(rule: AutomationRule): string {
  const p = new URLSearchParams({ to: rule.to.trim(), amount: rule.amount })
  return `/transfer?${p.toString()}`
}

// Human-readable cadence summary, e.g. "5 USDC · every 7 days".
export function describeRule(rule: AutomationRule): string {
  const c = CADENCES.find((x) => x.value === rule.cadence)
  return `${rule.amount} USDC · ${c ? c.every : rule.cadence}`
}

// ---- Rule collection helpers (pure) ----

// Build a full rule from a validated draft. `id`/`now` are injected so creation
// is deterministic in tests (no Date.now()/random inside).
export function createRule(draft: RuleDraft, id: string, nowIso: string): AutomationRule {
  return {
    id,
    label: draft.label.trim() || "Payment",
    to: draft.to.trim(),
    amount: draft.amount,
    cadence: draft.cadence,
    startAt: draft.startAt,
    lastRunAt: null,
    enabled: true,
    createdAt: nowIso,
  }
}

// Order rules for the list: due first, then soonest scheduled, paused, done.
export function sortRules(rules: AutomationRule[], nowMs: number = Date.now()): AutomationRule[] {
  const rank: Record<RuleState, number> = { due: 0, scheduled: 1, paused: 2, done: 3 }
  return [...rules].sort((a, b) => {
    const ra = rank[ruleState(a, nowMs)]
    const rb = rank[ruleState(b, nowMs)]
    if (ra !== rb) return ra - rb
    const na = nextDueAt(a, nowMs) ?? Infinity
    const nb = nextDueAt(b, nowMs) ?? Infinity
    return na - nb
  })
}

// Count of rules currently owing a payment — drives the nav/dashboard badge.
export function dueCount(rules: AutomationRule[], nowMs: number = Date.now()): number {
  return rules.filter((r) => isDue(r, nowMs)).length
}

// ---- Persistence (localStorage, per wallet) — mirrors lib/prefs key style ----

const KEY_PREFIX = "aether.automation."

export function storageKey(address: string): string {
  return `${KEY_PREFIX}${address.toLowerCase()}`
}

// True for any key this module owns (used by the Privacy/Settings data panel).
export function isAutomationKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX)
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Defensive parse — tolerate partial/legacy shapes without throwing.
function coerce(raw: unknown): AutomationRule[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (r): r is AutomationRule =>
      !!r && typeof r === "object" &&
      typeof (r as AutomationRule).id === "string" &&
      typeof (r as AutomationRule).to === "string" &&
      typeof (r as AutomationRule).amount === "string",
  )
}

export function loadRules(address: string): AutomationRule[] {
  if (!isBrowser() || !address) return []
  try {
    const raw = window.localStorage.getItem(storageKey(address))
    if (!raw) return []
    return coerce(JSON.parse(raw))
  } catch (error) {
    console.error("Failed to load automation rules", error)
    return []
  }
}

export function saveRules(address: string, rules: AutomationRule[]): boolean {
  if (!isBrowser() || !address) return false
  try {
    window.localStorage.setItem(storageKey(address), JSON.stringify(rules))
    return true
  } catch (error) {
    console.error("Failed to save automation rules", error)
    return false
  }
}
