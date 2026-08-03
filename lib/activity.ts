import type { ArcTx } from "@/lib/arc"

// Pure, testable display helpers for the Activity module (File 05 history,
// File 12 coverage). No React, no network — just formatting.

// Compact relative time: "just now", "5m ago", "3h ago", "2d ago", else date.
export function relativeTime(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return "—"
  const sec = Math.max(0, Math.floor((now - t) / 1000))
  if (sec < 45) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(t).toISOString().slice(0, 10)
}

// Human label for a tx: prefer the decoded method, else infer from direction.
export function methodLabel(tx: Pick<ArcTx, "method" | "direction">): string {
  if (tx.method && tx.method.trim()) {
    // camelCase / snake_case → Title Case words
    const words = tx.method
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
  }
  if (tx.direction === "out") return "Sent"
  if (tx.direction === "in") return "Received"
  return "Self transfer"
}

// Signed amount for display: outgoing is negative, incoming positive.
export function signedAmount(tx: Pick<ArcTx, "direction" | "valueUSDC">): string {
  const v = tx.valueUSDC
  const body = v.toLocaleString("en-US", { maximumFractionDigits: 4 })
  if (v === 0) return "0 USDC"
  if (tx.direction === "out") return `−${body} USDC`
  if (tx.direction === "in") return `+${body} USDC`
  return `${body} USDC`
}

// ── Timeline: grouping, filtering, and per-day summaries (File 05) ──────────

// The filters a user can apply to their history.
export type ActivityFilter = "all" | "in" | "out" | "failed"

// A calendar day's worth of transactions plus its rolled-up totals.
export interface ActivityDay {
  key: string // YYYY-MM-DD (local), stable group id
  label: string // "Today" / "Yesterday" / "Aug 1, 2026"
  txs: ArcTx[]
  inUSDC: number // total received that day
  outUSDC: number // total sent that day
  count: number
}

// Keep only the transactions matching a filter. "failed" spans any direction;
// direction filters ignore status so a failed send still shows under "Out".
export function filterActivity(txs: ArcTx[], filter: ActivityFilter): ArcTx[] {
  switch (filter) {
    case "in":
      return txs.filter((t) => t.direction === "in")
    case "out":
      return txs.filter((t) => t.direction === "out")
    case "failed":
      return txs.filter((t) => t.status === "error")
    default:
      return txs
  }
}

// Count of transactions each filter would show — powers the tab badges.
export function filterCounts(txs: ArcTx[]): Record<ActivityFilter, number> {
  return {
    all: txs.length,
    in: txs.filter((t) => t.direction === "in").length,
    out: txs.filter((t) => t.direction === "out").length,
    failed: txs.filter((t) => t.status === "error").length,
  }
}

// Local calendar day key (YYYY-MM-DD) for an ISO timestamp.
function dayKey(t: number): string {
  const d = new Date(t)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

// Human day heading: "Today", "Yesterday", else a friendly date. Older-than-this
// -year dates include the year so history never reads ambiguously.
export function dayLabel(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "Unknown date"
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return "Unknown date"
  if (dayKey(t) === dayKey(now)) return "Today"
  if (dayKey(t) === dayKey(now - 86_400_000)) return "Yesterday"
  const d = new Date(t)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })
}

// Group transactions into calendar days (most-recent first), each with its
// received/sent totals. Undated transactions fall into a trailing group so they
// are never silently dropped. Input order within a day is preserved.
export function groupByDay(txs: ArcTx[], now: number = Date.now()): ActivityDay[] {
  const order: string[] = []
  const map = new Map<string, ActivityDay>()
  for (const tx of txs) {
    const t = tx.timestamp ? new Date(tx.timestamp).getTime() : NaN
    const key = Number.isFinite(t) ? dayKey(t) : "unknown"
    let day = map.get(key)
    if (!day) {
      day = {
        key,
        label: key === "unknown" ? "Unknown date" : dayLabel(tx.timestamp, now),
        txs: [],
        inUSDC: 0,
        outUSDC: 0,
        count: 0,
      }
      map.set(key, day)
      order.push(key)
    }
    day.txs.push(tx)
    day.count++
    if (tx.status !== "error") {
      if (tx.direction === "in") day.inUSDC += tx.valueUSDC
      else if (tx.direction === "out") day.outUSDC += tx.valueUSDC
    }
  }
  // Real days newest-first; the "unknown" bucket always trails.
  return order
    .map((k) => map.get(k)!)
    .sort((a, b) => {
      if (a.key === "unknown") return 1
      if (b.key === "unknown") return -1
      return a.key < b.key ? 1 : a.key > b.key ? -1 : 0
    })
}
