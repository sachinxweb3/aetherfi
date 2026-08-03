"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Wallet, Activity, ArrowLeftRight, Send, Share2, CalendarClock,
  ArrowDownLeft, ArrowUpRight, Sparkles, AlertTriangle, CheckCircle2, Clock, RefreshCw,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { flowStats } from "@/lib/analytics"
import { buildInsight } from "@/lib/insight"
import { shouldAutoRefresh, refreshInterval, secondsUntilNext } from "@/lib/liveRefresh"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { loadContacts, contactFor, type Contact } from "@/lib/contacts"
import { ScoreGauge } from "@/components/dashboard/ScoreGauge"
import { ActivityTrend } from "@/components/dashboard/ActivityTrend"
import { AskAether } from "@/components/dashboard/AskAether"
import { TopSignals } from "@/components/dashboard/TopSignals"
import { AutomationStatus } from "@/components/dashboard/AutomationStatus"
import { DashboardSkeleton } from "./skeleton"

/* number formatting — shared, testable */
export function fmtUSDC(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " USDC"
}
export function fmtInt(n: number): string {
  return n.toLocaleString("en-US")
}
// Relative time for the activity feed — deterministic given (now, ts).
export function relTime(iso: string | null, now = Date.now()): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return "—"
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id

  const [data, setData] = React.useState<WalletKundli | null>(null)
  const [txs, setTxs] = React.useState<ArcTx[]>([])
  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  // Millisecond stamp of the last successful load — drives the live countdown.
  const updatedMsRef = React.useRef<number>(0)

  // Saved contacts resolve counterparty names in the activity feed (Address Book).
  React.useEffect(() => {
    if (address) setContacts(loadContacts(address))
    else setContacts([])
  }, [address])

  // Single source of truth for loading wallet data — callable from the mount
  // effect and the manual refresh control. Returns a cleanup-aware promise.
  const load = React.useCallback(
    async (isRefresh: boolean) => {
      if (!address || !isConnected || !onArc) {
        setData(null)
        setTxs([])
        return
      }
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const [k, a] = await Promise.all([
          fetch(`/api/kundli?address=${address}`).then((r) => r.json()),
          fetch(`/api/activity?address=${address}`).then((r) => r.json()).catch(() => ({ items: [] })),
        ])
        if (k.error) setError(k.error)
        else {
          setData(k as WalletKundli)
          setTxs((a.items as ArcTx[]) ?? [])
          const now = new Date()
          setUpdatedAt(now.toISOString())
          updatedMsRef.current = now.getTime()
        }
      } catch {
        setError("Could not reach Arc network")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [address, isConnected, onArc],
  )

  React.useEffect(() => {
    void load(false)
  }, [load])

  // Focus-aware auto-refresh — treat the dashboard as a live feed. Polls on a
  // steady cadence only while the tab is visible and the wallet is on Arc, and
  // pauses entirely when hidden (respects RPC rate limits + battery, File 16).
  React.useEffect(() => {
    if (!isConnected || !onArc) return
    const interval = refreshInterval(!!error)
    const tick = () => {
      if (
        shouldAutoRefresh({
          visible: document.visibilityState === "visible",
          connected: isConnected,
          onArc,
          inFlight: false,
        })
      ) {
        void load(true)
      }
    }
    const id = setInterval(tick, interval)
    // Refresh immediately when the tab regains focus after being away.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [isConnected, onArc, error, load])

  if (!isConnected) return <ConnectPrompt />
  if (!onArc) return <SwitchPrompt onSwitch={() => switchChain?.({ chainId: arcTestnet.id })} />
  if (loading && !data) return <DashboardSkeleton />
  if (error) return <ErrorBox msg={error} />
  if (!data) return <DashboardSkeleton />

  const flow = flowStats(txs)
  const insight = buildInsight(data, txs)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <RefreshBar
        updatedAt={updatedAt}
        updatedMs={updatedMsRef.current}
        refreshing={refreshing}
        hasError={!!error}
        onRefresh={() => void load(true)}
      />
      <Hero data={data} insight={insight} />

      <TopSignals data={data} txs={txs} />

      <AskAether data={data} txs={txs} />

      {/* The four numbers that matter — labeled like plain language, not metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Everything you hold" value={fmtUSDC(data.balanceUSDC)} href="/portfolio" />
        <Kpi icon={ArrowDownLeft} label="Came in" value={fmtUSDC(flow.totalIn)} tone="text-positive" />
        <Kpi icon={ArrowUpRight} label="Went out" value={fmtUSDC(flow.totalOut)} />
        <Kpi icon={Activity} label="Times you moved" value={fmtInt(data.txCount)} href="/activity" />
      </div>

      {/* Activity trend — the dashboard's time dimension (File 06) */}
      <ActivityTrend days={data.activityByDay} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity feed */}
        <RecentActivity txs={txs} address={data.address} contacts={contacts} />

        {/* Quick actions + automation status */}
        <div className="space-y-4">
          <div className="card-primary p-6">
            <SectionLabel>Move</SectionLabel>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickAction href="/transfer" icon={Send} label="Send USDC" />
              <QuickAction href="/automation" icon={CalendarClock} label="Automate" />
              <QuickAction href="/portfolio" icon={Wallet} label="Holdings" />
              <QuickAction href={`/w/${data.address}`} icon={Share2} label="Share" />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-4 text-xs text-silver-dim">
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              Swap &amp; bridge — arriving soon
            </div>
          </div>

          {address && <AutomationStatus address={address} />}
        </div>
      </div>

      {/* Badges */}
      <section className="card-primary p-6">
        <SectionLabel>What you&apos;ve earned</SectionLabel>
        <div className="mt-5 flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <span
              key={b.id}
              title={b.hint}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (b.earned
                  ? "border-champagne/40 bg-champagne/[0.08] text-foreground"
                  : "border-hairline text-silver-dim")
              }
            >
              {b.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

/* Shared section eyebrow — one consistent label voice across the dashboard */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}
/* ---------- Refresh bar: a calm hairline strip, not a monitoring console ---------- */
function RefreshBar({
  updatedAt, updatedMs, refreshing, hasError, onRefresh,
}: {
  updatedAt: string | null; updatedMs: number; refreshing: boolean; hasError: boolean; onRefresh: () => void
}) {
  // Tick every second so both the relative stamp and the countdown stay live.
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  const interval = refreshInterval(hasError)
  const secs = updatedMs > 0 ? secondsUntilNext(updatedMs, now, interval) : null
  const live = !hasError

  return (
    <div className="flex items-center justify-between border-b border-hairline pb-3">
      <div className="flex items-center gap-3 text-xs">
        <span className={"inline-flex items-center gap-2 " + (live ? "text-silver" : "text-caution")}>
          <span className="relative flex h-1.5 w-1.5">
            {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-50" />}
            <span className={"relative inline-flex h-1.5 w-1.5 rounded-full " + (live ? "bg-positive" : "bg-caution")} />
          </span>
          {live ? "Live" : "Reconnecting"}
        </span>
        <span className="text-silver-dim">
          {refreshing ? "Reading the ledger…" : updatedAt ? `Updated ${relTime(updatedAt, now)}` : "—"}
        </span>
        {!refreshing && secs != null && secs > 0 && (
          <span className="tabular-nums text-silver-dim" aria-hidden="true">· next read in {secs}s</span>
        )}
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-xs text-silver-dim transition-colors hover:text-foreground disabled:opacity-50"
        aria-label="Refresh dashboard data now"
      >
        <RefreshCw className={"h-3.5 w-3.5 " + (refreshing ? "animate-spin" : "")} aria-hidden="true" />
        Refresh
      </button>
    </div>
  )
}

/* ---------- Hero: identity band — the dashboard's iconic first screen.
   Reads as a masthead: who you are, your intelligence score, and the one
   thing AETHER wants you to know right now (File 03/06). ---------- */
function Hero({ data, insight }: { data: WalletKundli; insight: ReturnType<typeof buildInsight> }) {
  const reduced = useReducedMotion()
  const toneColor =
    insight.tone === "caution" ? "text-caution" : insight.tone === "positive" ? "text-positive" : "text-champagne"
  const ToneIcon = insight.tone === "caution" ? AlertTriangle : insight.tone === "positive" ? Sparkles : Clock

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="card-hero relative overflow-hidden p-7 sm:p-10"
    >
      {/* single, low champagne horizon — atmosphere, not decoration */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-champagne/[0.07] blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-10 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12">
        <ScoreGauge score={data.score} rank={data.rank} />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Your standing on Arc</p>
            <span className="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] text-silver-dim">
              {data.address.slice(0, 6)}…{data.address.slice(-4)}
            </span>
          </div>
          <h1 className="display mt-3 text-4xl leading-[0.98] text-ivory sm:text-6xl">
            You are{" "}
            <span className="italic text-champagne">{data.rank.toLowerCase()}</span>.
          </h1>
          <p className="mt-4 text-sm text-silver">
            Ahead of {data.percentile}% of wallets · {fmtInt(data.txCount)} transactions on record ·{" "}
            <Link href="/analytics" className="text-foreground underline decoration-hairline-strong underline-offset-4 transition hover:decoration-champagne">
              read the breakdown
            </Link>
          </p>

          {/* The one thing worth knowing — deterministic intelligence over real data */}
          <div className="mt-7 border-t border-hairline pt-6">
            <div className="flex items-center gap-2">
              <span className={"shrink-0 " + toneColor}><ToneIcon className="h-4 w-4" aria-hidden="true" /></span>
              <span className="eyebrow">Your wallet is telling you</span>
            </div>
            <p className="mt-3 max-w-lg text-lg font-medium leading-snug text-foreground">{insight.headline}</p>
            <p className="mt-1.5 max-w-lg text-sm text-silver">{insight.detail}</p>
            {insight.action && (
              <Link
                href={insight.action.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-champagne underline decoration-champagne/40 underline-offset-4 transition hover:decoration-champagne"
              >
                {insight.action.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function Kpi({
  icon: Icon, label, value, accent, tone, href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; accent?: boolean; tone?: string; href?: string
}) {
  const reduced = useReducedMotion()
  const inner = (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={"card-quiet h-full p-5 transition-colors " + (href ? "hover:border-hairline-strong" : "")}
    >
      <div className="flex items-center gap-2 text-xs text-silver-dim">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </div>
      <div className={"numeric mt-3 text-2xl font-semibold " + (accent ? "text-champagne" : tone ?? "text-foreground")}>{value}</div>
    </motion.div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

function RecentActivity({ txs, address, contacts }: { txs: ArcTx[]; address: string; contacts: Contact[] }) {
  const recent = txs.slice(0, 6)
  return (
    <div className="card-primary p-6 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <SectionLabel>What you&apos;ve done lately</SectionLabel>
        <Link href="/activity" className="text-xs text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
          See all
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-silver-dim">
          <Activity className="h-6 w-6 opacity-40" aria-hidden="true" />
          Nothing yet. Your first move will appear here.
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {recent.map((t) => (
            <TxRow key={t.hash} t={t} self={address} contacts={contacts} />
          ))}
        </ul>
      )}
    </div>
  )
}

function TxRow({ t, self, contacts }: { t: ArcTx; self: string; contacts: Contact[] }) {
  const inbound = t.direction === "in"
  const failed = t.status === "error"
  const Icon = failed ? AlertTriangle : inbound ? ArrowDownLeft : t.direction === "self" ? CheckCircle2 : ArrowUpRight
  const iconTone = failed ? "text-negative" : inbound ? "text-positive" : "text-silver"
  const other = inbound ? t.from : t.to
  const known = other ? contactFor(contacts, other) : null
  const label = t.direction === "self" ? "Moved to yourself" : inbound ? "Received" : "Sent"
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={"shrink-0 " + iconTone}><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {known && <span className="shrink-0 rounded-full border border-champagne/30 bg-champagne/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-champagne">{known.label}</span>}
          {t.method && <span className="truncate text-xs text-silver-dim">· {t.method}</span>}
        </div>
        <div className="truncate font-mono text-xs text-silver-dim">
          {other ? `${other.slice(0, 10)}…${other.slice(-6)}` : "—"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={"numeric text-sm font-semibold " + (inbound ? "text-positive" : "text-foreground")}>
          {inbound ? "+" : t.direction === "out" ? "−" : ""}{fmtUSDC(t.valueUSDC)}
        </div>
        <div className="text-[11px] text-silver-dim">{relTime(t.timestamp)}</div>
      </div>
    </li>
  )
}

function QuickAction({
  href, icon: Icon, label, external,
}: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; external?: boolean }) {
  const cls =
    "flex flex-col items-center gap-2 rounded-xl border border-hairline p-4 text-xs text-silver transition-colors hover:border-hairline-strong hover:text-foreground"
  const inner = (
    <>
      <Icon className="h-5 w-5 text-champagne" aria-hidden="true" />
      {label}
    </>
  )
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

function ConnectPrompt() {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow">Your dashboard</p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-6xl">
        Your wallet <span className="italic text-champagne">is the login</span>.
      </h2>
      <p className="max-w-md text-silver">No password. No sign-up. AetherFI reads your Arc history — it never signs for you.</p>
      <ConnectButton showBalance={false} chainStatus="icon" />
    </div>
  )
}

function SwitchPrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow">Wrong network</p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-6xl">
        AetherFI lives on <span className="italic text-champagne">Arc</span>.
      </h2>
      <p className="max-w-md text-silver">Approve the prompt to add and switch to Arc Testnet.</p>
      <button onClick={onSwitch} className="btn-champagne px-7 py-3.5 text-[15px]">
        Switch to Arc
      </button>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4">
      <div className="flex items-center gap-2 text-negative">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span className="eyebrow text-negative">Interrupted</span>
      </div>
      <h2 className="display text-3xl text-ivory sm:text-5xl">{msg}</h2>
      <p className="text-silver">Give it a moment and try again.</p>
    </div>
  )
}
