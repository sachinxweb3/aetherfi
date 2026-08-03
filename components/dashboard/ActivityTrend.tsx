"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { activityTrend } from "@/lib/analytics"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Dashboard activity trend — a 14-day transaction sparkline built from the
// activityByDay array already returned by /api/kundli. No new fetch, no new
// dependency: pure SVG bars + real momentum math (File 06). The dashboard's
// time dimension. Rendered as a calm reading of the ledger, not a chart card.

type Day = { date: string; count: number }

function shortDay(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)
}
function fullDay(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ActivityTrend({ days }: { days: Day[] }) {
  const reduced = useReducedMotion()
  const t = activityTrend(days)
  const empty = t.total === 0

  const DeltaIcon = t.deltaPct == null ? Minus : t.deltaPct > 0 ? TrendingUp : t.deltaPct < 0 ? TrendingDown : Minus
  const deltaTone =
    t.deltaPct == null || t.deltaPct === 0 ? "text-silver-dim" : t.deltaPct > 0 ? "text-positive" : "text-caution"
  const deltaLabel = t.deltaPct == null ? "new" : `${t.deltaPct > 0 ? "+" : ""}${t.deltaPct}%`

  return (
    <section className="card-primary p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="eyebrow flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-champagne" aria-hidden="true" /> Understand what happened
        </p>
        <Link href="/analytics" className="text-xs text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
          Details
        </Link>
      </div>

      {empty ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-silver-dim">
          <BarChart3 className="h-6 w-6 opacity-40" aria-hidden="true" />
          No activity in this window yet. Your daily transactions will chart here.
        </div>
      ) : (
        <>
          {/* Bars — champagne columns on the calm graphite field */}
          <div className="flex h-28 items-end gap-1" role="img" aria-label={`${t.total} transactions across ${t.window} days, ${t.activeDays} active`}>
            {days.map((d, i) => {
              const h = Math.max(4, Math.round((d.count / t.peak) * 100))
              return (
                <div key={d.date || i} className="group relative flex flex-1 items-end justify-center" style={{ height: "100%" }}>
                  <motion.div
                    className={
                      "w-full rounded-t " +
                      (d.count > 0 ? "bg-champagne/35 transition-colors group-hover:bg-champagne/55" : "bg-champagne/[0.05]")
                    }
                    initial={reduced ? false : { height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={reduced ? { duration: 0 } : { delay: 0.03 * i, duration: 0.5, ease: "easeOut" }}
                    style={{ minHeight: 4 }}
                  />
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md border border-hairline-strong bg-graphite/95 px-2 py-1 text-[10px] text-foreground opacity-0 transition group-hover:opacity-100">
                    {d.count} tx · {fullDay(d.date)}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Day labels — first and last only, to avoid clutter */}
          <div className="mt-1.5 flex justify-between text-[10px] text-silver-dim">
            <span>{fullDay(days[0]?.date ?? "")}</span>
            <span>{fullDay(days[days.length - 1]?.date ?? "")}</span>
          </div>

          {/* Summary row — three quiet numbers */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-center">
            <Metric label="Total" value={`${t.total}`} sub="transactions" />
            <Metric label="Active" value={`${t.activeDays}`} sub={`of ${t.window} days`} />
            <div>
              <div className={"flex items-center justify-center gap-1 text-lg font-semibold tabular-nums " + deltaTone}>
                <DeltaIcon className="h-4 w-4" aria-hidden="true" /> {deltaLabel}
              </div>
              <div className="text-[11px] text-silver-dim">vs prior half</div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="numeric text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-silver-dim">{label} · {sub}</div>
    </div>
  )
}
