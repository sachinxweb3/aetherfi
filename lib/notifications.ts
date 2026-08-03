import type { WalletKundli, ArcTx } from "@/lib/arc"
import { isDue, nextDueAt, type AutomationRule } from "@/lib/automation"
import { nextRankGap } from "@/lib/levelUp"

// Notifications — AETHER's alert center (File 03 OS surface, File 06 intelligence).
// There is no backend and AETHER stores no server-side event log, so a
// notification is DERIVED deterministically from real, current facts: on-chain
// transactions, the wallet's kundli, and the user's own automation rules. Each
// alert carries a STABLE id tied to the underlying fact (a tx hash, a rule id),
// so "read" and "dismissed" state persists across reloads without fabricating an
// event history (File 16 honesty). Pure + serializable — no React, no DOM — so
// the derivation is unit-tested in isolation and the view/persistence stay thin.

export type NotifKind = "automation" | "transaction" | "funding" | "rank"

export type NotifTone = "positive" | "neutral" | "caution"

export interface Notification {
  id: string // stable, derived from the fact (e.g. "af:tx-failed:0x…")
  kind: NotifKind
  title: string
  body: string
  tone: NotifTone
  href?: string
  ts: number // ms — when the underlying fact occurred (drives ordering)
}

// A notification with its persisted read/dismissed flags resolved for display.
export interface ResolvedNotification extends Notification {
  read: boolean
}

// Everything the deriver reads. All optional-friendly so the view can call it
// before data has loaded without special-casing.
export interface NotifInput {
  kundli: WalletKundli | null
  txs: ArcTx[]
  rules: AutomationRule[]
}

// Only surface the few most recent receipts so the center stays signal, not
// noise — older inbound transfers still live in the Activity feed.
const MAX_RECEIPTS = 4
const MAX_NOTIFS = 24

function money(n: number): string {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`
}

function tsOf(iso: string | null, fallback: number): number {
  if (!iso) return fallback
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : fallback
}

// Derive the current alert set from real facts. Deterministic for a given
// `nowMs` — the same inputs always yield the same ids, so read/dismissed state
// stays attached to the thing it describes.
export function buildNotifications(input: NotifInput, nowMs: number = Date.now()): Notification[] {
  const { kundli, txs, rules } = input
  const out: Notification[] = []

  // 1. Automation due now — the most actionable, one per due rule (File 02).
  for (const r of rules) {
    if (!isDue(r, nowMs)) continue
    out.push({
      id: `af:automation:${r.id}`,
      kind: "automation",
      title: `Payment due: ${r.label}`,
      body: `${money(Number(r.amount))} is scheduled to send now. Review and sign it yourself.`,
      tone: "caution",
      href: "/automation",
      ts: nextDueAt(r, nowMs) ?? nowMs,
    })
  }

  // 2. Failed transactions — still cost gas, worth flagging (one per hash).
  for (const t of txs) {
    if (t.status !== "error") continue
    out.push({
      id: `af:tx-failed:${t.hash}`,
      kind: "transaction",
      title: "Transaction failed",
      body: `A ${t.direction === "in" ? "incoming" : "recent"} transaction failed. Failed sends still cost gas — check balance before retrying.`,
      tone: "caution",
      href: "/activity",
      ts: tsOf(t.timestamp, nowMs),
    })
  }

  // 3. Recent receipts — money arriving is genuinely notable (cap to newest few).
  const receipts = txs
    .filter((t) => t.direction === "in" && t.status === "ok" && t.valueUSDC > 0)
    .slice(0, MAX_RECEIPTS)
  for (const t of receipts) {
    out.push({
      id: `af:rx:${t.hash}`,
      kind: "transaction",
      title: `Received ${money(t.valueUSDC)}`,
      body: `Incoming transfer from ${t.from.slice(0, 10)}…${t.from.slice(-6)} landed on Arc.`,
      tone: "positive",
      href: "/activity",
      ts: tsOf(t.timestamp, nowMs),
    })
  }

  if (kundli) {
    // 4. Funding needed — empty wallet can't transact.
    if (kundli.balanceUSDC <= 0) {
      out.push({
        id: "af:funding",
        kind: "funding",
        title: "Fund your wallet",
        body: "Your Arc balance is empty. Grab test USDC from the faucet to start transacting.",
        tone: "neutral",
        href: "/transfer",
        ts: nowMs,
      })
    }

    // 5. Rank proximity — a live, earnable goal (mirrors the real score math).
    const gap = nextRankGap(kundli.score)
    if (gap.nextRank && gap.toNextRank > 0 && gap.toNextRank <= 60) {
      out.push({
        id: `af:rank:${gap.nextRank}`,
        kind: "rank",
        title: `${gap.toNextRank} pts from ${gap.nextRank}`,
        body: `You rank as ${kundli.rank}. A little more on-chain activity lifts you to ${gap.nextRank}.`,
        tone: "positive",
        href: "/analytics",
        ts: nowMs,
      })
    }
  }

  // Caution first, then newest — the thing needing action leads, recency breaks ties.
  const tonePriority: Record<NotifTone, number> = { caution: 0, positive: 1, neutral: 2 }
  return out
    .sort((a, b) => {
      const p = tonePriority[a.tone] - tonePriority[b.tone]
      return p !== 0 ? p : b.ts - a.ts
    })
    .slice(0, MAX_NOTIFS)
}

// ---- Read / dismissed state (persisted, pure operations) ----

export interface NotifState {
  read: string[] // ids the user has seen
  dismissed: string[] // ids the user has cleared
}

export const EMPTY_STATE: NotifState = { read: [], dismissed: [] }

// Apply persisted state to a freshly derived list: drop dismissed, tag read.
// Pure — the view passes state in, so this is fully testable.
export function resolve(notifs: Notification[], state: NotifState): ResolvedNotification[] {
  const read = new Set(state.read)
  const dismissed = new Set(state.dismissed)
  return notifs
    .filter((n) => !dismissed.has(n.id))
    .map((n) => ({ ...n, read: read.has(n.id) }))
}

// Count of visible, unread notifications — drives the header bell badge.
export function unreadCount(notifs: Notification[], state: NotifState): number {
  return resolve(notifs, state).filter((n) => !n.read).length
}

// Mark every currently-visible notification as read (opening the panel).
export function markAllRead(notifs: Notification[], state: NotifState): NotifState {
  const ids = resolve(notifs, state).map((n) => n.id)
  const read = new Set([...state.read, ...ids])
  return { ...state, read: [...read] }
}

export function markRead(state: NotifState, id: string): NotifState {
  if (state.read.includes(id)) return state
  return { ...state, read: [...state.read, id] }
}

// Dismiss one notification — it won't reappear even though the fact persists.
export function dismiss(state: NotifState, id: string): NotifState {
  const dismissed = state.dismissed.includes(id) ? state.dismissed : [...state.dismissed, id]
  return { ...state, dismissed }
}

// Clear all currently-visible notifications at once.
export function dismissAll(notifs: Notification[], state: NotifState): NotifState {
  const ids = resolve(notifs, state).map((n) => n.id)
  const dismissed = new Set([...state.dismissed, ...ids])
  return { ...state, dismissed: [...dismissed] }
}

// Prune read/dismissed ids that no longer correspond to any live fact, so the
// stored arrays can't grow without bound as transactions age out of the sample.
export function prune(state: NotifState, liveIds: string[]): NotifState {
  const live = new Set(liveIds)
  return {
    read: state.read.filter((id) => live.has(id)),
    dismissed: state.dismissed.filter((id) => live.has(id)),
  }
}

// ---- Persistence (localStorage, per wallet) — mirrors lib/automation key style ----

const KEY_PREFIX = "aether.notif."

export function storageKey(address: string): string {
  return `${KEY_PREFIX}${address.toLowerCase()}`
}

export function isNotifKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX)
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function coerce(raw: unknown): NotifState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STATE }
  const r = raw as Partial<NotifState>
  return {
    read: Array.isArray(r.read) ? r.read.filter((x): x is string => typeof x === "string") : [],
    dismissed: Array.isArray(r.dismissed) ? r.dismissed.filter((x): x is string => typeof x === "string") : [],
  }
}

export function loadState(address: string): NotifState {
  if (!isBrowser() || !address) return { ...EMPTY_STATE }
  try {
    const raw = window.localStorage.getItem(storageKey(address))
    if (!raw) return { ...EMPTY_STATE }
    return coerce(JSON.parse(raw))
  } catch (error) {
    console.error("Failed to load notification state", error)
    return { ...EMPTY_STATE }
  }
}

export function saveState(address: string, state: NotifState): boolean {
  if (!isBrowser() || !address) return false
  try {
    window.localStorage.setItem(storageKey(address), JSON.stringify(state))
    return true
  } catch (error) {
    console.error("Failed to save notification state", error)
    return false
  }
}
