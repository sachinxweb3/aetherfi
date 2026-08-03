"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, Send, ArrowRight } from "lucide-react"
import { shortAddr } from "@/lib/transfer"
import {
  loadRules, sortRules, ruleState, nextDueAt, describeRule, runHref,
  type AutomationRule,
} from "@/lib/automation"

// Automation status — the dashboard's window into scheduled payments (File 03
// "Automation Status" section). Reads the same per-wallet rules the Automation
// page owns; surfaces anything due now with a one-tap send, else the next
// upcoming payment. Silent when the user has no rules (no empty noise on the
// dashboard — the Automation page owns onboarding).

const DAY = 86_400_000

function relDue(ms: number | null, now: number): string {
  if (ms === null) return "done"
  const diff = ms - now
  if (diff <= 0) return "due now"
  const d = Math.round(diff / DAY)
  if (d === 0) return "today"
  if (d === 1) return "tomorrow"
  if (d < 30) return `in ${d}d`
  return `in ${Math.round(d / 30)}mo`
}

export function AutomationStatus({ address }: { address: string }) {
  const [rules, setRules] = React.useState<AutomationRule[]>([])
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    setRules(loadRules(address))
  }, [address])

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const active = rules.filter((r) => r.enabled)
  if (active.length === 0) return null // nothing scheduled → stay quiet

  const sorted = sortRules(active, now)
  const due = sorted.filter((r) => ruleState(r, now) === "due")
  const upcoming = sorted.filter((r) => ruleState(r, now) === "scheduled").slice(0, 3)

  return (
    <div className="card-primary p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-champagne" aria-hidden="true" /> Automation
        </div>
        <Link href="/automation" className="text-xs text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">Manage →</Link>
      </div>

      {due.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-positive">{due.length} due now</div>
          {due.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-positive/20 bg-positive/[0.06] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{r.label}</div>
                <div className="truncate text-xs text-silver-dim">{describeRule(r)}</div>
              </div>
              <Link href={runHref(r)} className="btn-champagne inline-flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs">
                <Send className="h-3 w-3" aria-hidden="true" /> Send
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((r) => (
            <Link key={r.id} href="/automation" className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2 transition hover:border-hairline-strong">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{r.label}</div>
                <div className="truncate font-mono text-xs text-silver-dim">{r.amount} USDC → {shortAddr(r.to)}</div>
              </div>
              <span className="shrink-0 text-xs text-silver-dim">{relDue(nextDueAt(r, now), now)}</span>
            </Link>
          ))}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-silver-dim">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> {active.length} active {active.length === 1 ? "rule" : "rules"}
          </div>
        </div>
      )}
    </div>
  )
}
