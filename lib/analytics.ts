import type { ArcTx } from "@/lib/arc"

// Pure, testable analytics over a wallet's recent transactions (File 06
// insights, File 12 coverage). No React, no network — derived entirely from
// on-chain data already fetched for Activity. Never fabricated.

export interface FlowStats {
  inCount: number
  outCount: number
  selfCount: number
  totalIn: number // USDC received
  totalOut: number // USDC sent
  net: number // in - out
  failed: number
  gasSpent: number // sum of fees on outgoing tx
  sampleSize: number
}

// Aggregate directional flow from a set of normalized transactions.
export function flowStats(txs: ArcTx[]): FlowStats {
  const s: FlowStats = {
    inCount: 0, outCount: 0, selfCount: 0,
    totalIn: 0, totalOut: 0, net: 0, failed: 0, gasSpent: 0,
    sampleSize: txs.length,
  }
  for (const t of txs) {
    if (t.status === "error") s.failed++
    if (t.direction === "in") {
      s.inCount++
      s.totalIn += t.valueUSDC
    } else if (t.direction === "out") {
      s.outCount++
      s.totalOut += t.valueUSDC
      s.gasSpent += t.feeUSDC
    } else {
      s.selfCount++
      s.gasSpent += t.feeUSDC
    }
  }
  s.net = s.totalIn - s.totalOut
  return s
}

// Success rate (0..100) over the sample; 100 when there are no transactions.
export function successRate(txs: ArcTx[]): number {
  if (txs.length === 0) return 100
  const ok = txs.filter((t) => t.status !== "error").length
  return Math.round((ok / txs.length) * 100)
}

// Busiest day label + count from a 14-day activity array.
export function busiestDay(days: { date: string; count: number }[]): { date: string; count: number } | null {
  if (days.length === 0) return null
  return days.reduce((best, d) => (d.count > best.count ? d : best), days[0])
}

// Current trailing streak of consecutive active days ending at the latest day.
export function activeStreak(days: { date: string; count: number }[]): number {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++
    else break
  }
  return streak
}

export interface ActivityTrend {
  total: number // transactions across the window
  peak: number // busiest single day's count (>=1, for bar scaling)
  activeDays: number // days with at least one tx
  avgPerActiveDay: number // total / activeDays, 0 when none
  deltaPct: number | null // % change: recent half vs older half; null if no older activity
  window: number // number of days in the array
}

// Trend summary over the activity window, splitting it into an older and a
// recent half to derive momentum. Pure + deterministic (File 06, File 12).
export function activityTrend(days: { date: string; count: number }[]): ActivityTrend {
  const window = days.length
  const total = days.reduce((s, d) => s + d.count, 0)
  const peak = days.reduce((m, d) => Math.max(m, d.count), 0)
  const activeDays = days.filter((d) => d.count > 0).length
  const avgPerActiveDay = activeDays > 0 ? total / activeDays : 0

  const mid = Math.floor(window / 2)
  const older = days.slice(0, mid).reduce((s, d) => s + d.count, 0)
  const recent = days.slice(mid).reduce((s, d) => s + d.count, 0)
  const deltaPct = older > 0 ? Math.round(((recent - older) / older) * 100) : null

  return { total, peak: Math.max(peak, 1), activeDays, avgPerActiveDay, deltaPct, window }
}
