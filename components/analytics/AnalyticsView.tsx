"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart3, TrendingUp, TrendingDown, Minus, ArrowDownLeft, ArrowUpRight, Wallet,
  AlertTriangle, CheckCircle2, CalendarDays, Activity as ActivityIcon, Users,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { scoreBreakdown, type ScoreFactor } from "@/lib/arc"
import { flowStats, successRate, busiestDay, activeStreak, activityTrend, counterpartyStats } from "@/lib/analytics"
import type { ActivityTrend as ActivityTrendStats } from "@/lib/analytics"
import { levelUpPlan, type LevelUpTip } from "@/lib/levelUp"
import { shortAddr } from "@/lib/transfer"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, stagger, DUR, EASE } from "@/lib/motion"

// Understand — explainable insights over data already fetched for the aura and
// activity views. Read-only, no new source, nothing fabricated: the score
// breakdown is the real weighted math, the flow is the real tx sample.

function fmt(n: number, max = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: max })
}

export function AnalyticsView() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [kundli, setKundli] = React.useState<WalletKundli | null>(null)
  const [txs, setTxs] = React.useState<ArcTx[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!address || !isConnected || !onArc) {
      setKundli(null)
      setTxs(null)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/kundli?address=${address}`).then((r) => r.json()),
      fetch(`/api/activity?address=${address}`).then((r) => r.json()),
    ])
      .then(([k, a]) => {
        if (!alive) return
        if (k.error) setError(k.error)
        else {
          setKundli(k as WalletKundli)
          setTxs((a.items as ArcTx[]) ?? [])
        }
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setError("Could not reach Arc network")
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [address, isConnected, onArc])

  if (!isConnected)
    return (
      <Centered icon={BarChart3} title="Connect to see your analytics">
        <p className="text-silver">Your wallet is your login. These insights come from your real Arc activity.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Approve the prompt to switch to Arc Testnet.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  if (loading && !kundli) return <Skeleton />
  if (error)
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md rounded-2xl border border-negative/30 bg-negative/[0.06] p-6 text-center">
        <div className="flex justify-center text-negative"><AlertTriangle className="h-7 w-7" aria-hidden="true" /></div>
        <div className="mt-2 font-medium text-foreground">{error}</div>
        <p className="mt-1 text-xs text-silver-dim">Give it a moment and try again.</p>
      </div>
    )
  if (!kundli) return <Skeleton />

  const flow = flowStats(txs ?? [])
  const factors = scoreBreakdown({
    balanceUSDC: kundli.balanceUSDC,
    txCount: kundli.txCount,
    gasUsed: kundli.gasUsed,
    tokenTransfers: kundli.tokenTransfers,
    walletAgeDays: kundli.walletAgeDays,
  })
  const rate = successRate(txs ?? [])
  const busy = busiestDay(kundli.activityByDay)
  const streak = activeStreak(kundli.activityByDay)
  const trend = activityTrend(kundli.activityByDay)
  const peers = counterpartyStats(txs ?? [])
  const plan = levelUpPlan({
    balanceUSDC: kundli.balanceUSDC,
    txCount: kundli.txCount,
    gasUsed: kundli.gasUsed,
    tokenTransfers: kundli.tokenTransfers,
    walletAgeDays: kundli.walletAgeDays,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div {...rise(reduced, 0.05)}>
        <p className="eyebrow">Understand</p>
        <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Why your score is what it is.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-silver">
          The real weighted math behind your intelligence score, your flow, and your habits. Read-only.
        </p>
      </motion.div>

      {/* Flow stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ArrowDownLeft} label="Received" value={`${fmt(flow.totalIn)} USDC`} sub={`${flow.inCount} tx`} tone="text-positive" reduced={reduced} index={0} />
        <Stat icon={ArrowUpRight} label="Sent" value={`${fmt(flow.totalOut)} USDC`} sub={`${flow.outCount} tx`} reduced={reduced} index={1} />
        <Stat icon={TrendingUp} label="Net flow" value={`${flow.net >= 0 ? "+" : "−"}${fmt(Math.abs(flow.net))} USDC`} sub={`over last ${flow.sampleSize} tx`} tone={flow.net >= 0 ? "text-positive" : "text-caution"} accent reduced={reduced} index={2} />
        <Stat icon={Wallet} label="Gas spent" value={`${fmt(flow.gasSpent, 4)} USDC`} sub={`${flow.failed} failed`} reduced={reduced} index={3} />
      </div>

      {/* Score breakdown */}
      <motion.section {...rise(reduced, 0.1)} className="card-primary p-6">
        <div className="flex items-end justify-between">
          <p className="eyebrow flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-champagne" aria-hidden="true" /> Score breakdown
          </p>
          <div className="text-sm text-silver">
            <span className="champagne-sheen font-bold">{kundli.score}</span>/1000 · {kundli.rank}
          </div>
        </div>
        <p className="mt-3 text-sm text-silver">Each factor earns its share of your score. Longer bar, more points.</p>
        <div className="mt-5 space-y-3">
          {factors.map((f, i) => (
            <FactorBar key={f.key} f={f} index={i} reduced={reduced} />
          ))}
        </div>
      </motion.section>

      {/* Level up — actionable, real-math recommendations */}
      {plan.tips.length > 0 && <LevelUp plan={plan} reduced={reduced} />}

      {/* Activity cadence — 14-day trend from the real activityByDay window */}
      <ActivityCadence days={kundli.activityByDay} trend={trend} reduced={reduced} />

      {/* Streaks / cadence */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={ActivityIcon} label="Success rate" value={`${rate}%`} sub={`${(txs ?? []).length} recent tx`} tone={rate >= 90 ? "text-positive" : "text-foreground"} reduced={reduced} index={0} />
        <Stat icon={CalendarDays} label="Active streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} sub="consecutive, trailing" reduced={reduced} index={1} />
        <Stat icon={CheckCircle2} label="Busiest day" value={busy && busy.count > 0 ? `${busy.count} tx` : "—"} sub={busy && busy.count > 0 ? busy.date : "no activity yet"} reduced={reduced} index={2} />
      </div>

      {/* Counterparties — distinct peers from the real tx sample */}
      <Counterparties peers={peers} reduced={reduced} />

      <Link href="/dashboard" className="inline-block text-sm text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
        ← Back to dashboard
      </Link>
    </div>
  )
}

function ActivityCadence({
  days, trend, reduced,
}: {
  days: { date: string; count: number }[]
  trend: ActivityTrendStats
  reduced: boolean
}) {
  const empty = trend.total === 0
  const DeltaIcon = trend.deltaPct == null ? Minus : trend.deltaPct > 0 ? TrendingUp : trend.deltaPct < 0 ? TrendingDown : Minus
  const deltaTone =
    trend.deltaPct == null || trend.deltaPct === 0 ? "text-silver-dim" : trend.deltaPct > 0 ? "text-positive" : "text-caution"
  const deltaLabel = trend.deltaPct == null ? "new" : `${trend.deltaPct > 0 ? "+" : ""}${trend.deltaPct}%`

  return (
    <motion.section {...rise(reduced, 0.1)} className="card-primary p-6">
      <p className="eyebrow flex items-center gap-2">
        <ActivityIcon className="h-3 w-3 text-champagne" aria-hidden="true" /> Activity cadence
        <span className="font-normal normal-case tracking-normal text-silver-dim">last {trend.window} days</span>
      </p>

      {empty ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-silver-dim">
          <ActivityIcon className="h-6 w-6 opacity-40" aria-hidden="true" />
          No activity in this window yet. Your daily transactions will chart here.
        </div>
      ) : (
        <>
          {/* Bars — champagne columns on the calm graphite field */}
          <div className="mt-5 flex h-28 items-end gap-1" role="img" aria-label={`${trend.total} transactions across ${trend.window} days, ${trend.activeDays} active`}>
            {days.map((d, i) => {
              const h = Math.max(4, Math.round((d.count / trend.peak) * 100))
              return (
                <div key={d.date || i} className="group relative flex flex-1 items-end justify-center" style={{ height: "100%" }}>
                  <motion.div
                    className={
                      "w-full rounded-t transition-colors " +
                      (d.count > 0 ? "bg-champagne/35 group-hover:bg-champagne/55" : "bg-champagne/[0.05]")
                    }
                    initial={reduced ? false : { height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={reduced ? { duration: 0 } : { delay: 0.03 * i, duration: 0.5, ease: "easeOut" }}
                    style={{ minHeight: 4 }}
                  />
                  <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md border border-hairline-strong bg-graphite/95 px-2 py-1 text-[10px] text-foreground opacity-0 transition group-hover:opacity-100">
                    {d.count} tx · {shortDay(d.date)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-silver-dim">
            <span>{shortDay(days[0]?.date ?? "")}</span>
            <span>{shortDay(days[days.length - 1]?.date ?? "")}</span>
          </div>

          {/* Summary row — three quiet numbers from the real window */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-center">
            <Metric label="Total" value={`${trend.total}`} sub="transactions" />
            <Metric label="Active" value={`${trend.activeDays}`} sub={`of ${trend.window} days`} />
            <Metric label="Pace" value={fmt(trend.avgPerActiveDay, 1)} sub="per active day" />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-silver">
            <DeltaIcon className={"h-3.5 w-3.5 " + deltaTone} aria-hidden="true" />
            <span className={deltaTone}>{deltaLabel}</span>
            <span className="text-silver-dim">activity vs the prior half of the window</span>
          </p>
        </>
      )}
    </motion.section>
  )
}

function shortDay(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="numeric text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-silver-dim">{label} · {sub}</div>
    </div>
  )
}

function Counterparties({
  peers, reduced,
}: {
  peers: ReturnType<typeof counterpartyStats>
  reduced: boolean
}) {
  const hasPeers = peers.unique > 0
  return (
    <motion.section {...rise(reduced, 0.1)} className="card-primary p-6">
      <p className="eyebrow flex items-center gap-2">
        <Users className="h-3 w-3 text-champagne" aria-hidden="true" /> Counterparties
        <span className="font-normal normal-case tracking-normal text-silver-dim">in the recent sample</span>
      </p>
      {hasPeers ? (
        <>
          <p className="mt-3 text-sm text-silver">
            You&apos;ve interacted with <span className="font-semibold text-foreground">{peers.unique}</span> distinct
            {peers.unique === 1 ? " address" : " addresses"} across the recent sample.
          </p>
          {peers.top && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-obsidian/30 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne/[0.06] text-xs font-semibold text-champagne">
                {peers.top.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm text-foreground">{shortAddr(peers.top.address)}</div>
                <div className="text-xs text-silver-dim">most frequent counterparty</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-3 flex items-start gap-2 text-sm text-silver-dim">
          <Users className="mt-0.5 h-4 w-4 shrink-0 opacity-40" aria-hidden="true" />
          No counterparty activity in the recent sample yet.
        </p>
      )}
    </motion.section>
  )
}

function FactorBar({ f, index, reduced }: { f: ScoreFactor; index: number; reduced: boolean }) {
  const pct = Math.round(f.factor * 100)
  const maxPts = Math.round(f.weight * 1000)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground">{f.label}</span>
        <span className="text-silver-dim tabular-nums">{f.points}/{maxPts} pts</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-champagne/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-champagne-deep via-champagne to-ice"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={reduced ? { duration: 0 } : { delay: 0.05 * index, duration: DUR.base, ease: EASE }}
        />
      </div>
    </div>
  )
}

function LevelUp({ plan, reduced }: { plan: ReturnType<typeof levelUpPlan>; reduced: boolean }) {
  return (
    <motion.section {...rise(reduced, 0.1)} className="card-primary p-6">
      <p className="eyebrow flex items-center gap-2">
        <TrendingUp className="h-3 w-3 text-champagne" aria-hidden="true" /> What moves the score
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-silver">
        {plan.nextRank
          ? <>You&apos;re <span className="font-semibold text-foreground">{plan.toNextRank}</span> points from <span className="champagne-sheen font-semibold">{plan.nextRank}</span>. These are real projected gains, not guesses.</>
          : <>You&apos;re at the top rank. These actions still push your score higher.</>}
      </p>
      <ul className="mt-5 space-y-2">
        {plan.tips.map((tip, i) => (
          <LevelUpRow key={tip.key} tip={tip} index={i} reduced={reduced} />
        ))}
      </ul>
    </motion.section>
  )
}

function LevelUpRow({ tip, index, reduced }: { tip: LevelUpTip; index: number; reduced: boolean }) {
  return (
    <motion.li
      {...stagger(reduced, index)}
      className="flex items-center gap-3 rounded-xl border border-hairline bg-obsidian/30 px-3.5 py-3"
    >
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-champagne/[0.1] px-2.5 py-1 text-xs font-semibold text-champagne tabular-nums">
        +{tip.gain}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{tip.label}</div>
        <div className="text-xs text-silver-dim">{tip.detail}</div>
      </div>
      <Link
        href={tip.href}
        className="shrink-0 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-champagne/40 hover:text-champagne"
      >
        Go
      </Link>
    </motion.li>
  )
}

function Stat({
  icon: Icon, label, value, sub, tone, accent, reduced, index,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; sub?: string; tone?: string; accent?: boolean; reduced: boolean; index: number
}) {
  return (
    <motion.div {...rise(reduced, Math.min(index * 0.05, 0.15))} className="card-quiet p-5">
      <div className="flex items-center gap-2 text-xs text-silver-dim">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </div>
      <div className={"numeric mt-3 text-2xl font-semibold " + (accent ? "text-champagne" : tone ?? "text-foreground")}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-silver-dim">{sub}</div>}
    </motion.div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-quiet space-y-3 p-5">
            <span className="shimmer block h-3 w-16 rounded" />
            <span className="shimmer block h-5 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="card-primary space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="shimmer block h-2 w-full rounded" />
        ))}
      </div>
    </div>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow flex items-center gap-2">
        {Icon && <Icon className="h-3 w-3 text-champagne" aria-hidden="true" />} Understand
      </p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-5xl">{title}</h2>
      {children}
    </div>
  )
}
