"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShieldCheck, ShieldAlert, ShieldX, Info, AlertTriangle, ExternalLink, KeyRound,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { ARCSCAN_URL } from "@/lib/arc"
import { securityReport, approvalActivity, type SecurityCheck, type CheckStatus, type SecurityInput } from "@/lib/security"
import { shortAddr } from "@/lib/transfer"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Security — a deterministic, honest wallet checkup over the SAME on-chain data
// the aura and activity views already fetch (File 06 intelligence, File 16
// honesty). Read-only. Nothing fabricated: approval calls are detected by
// method name and we state plainly the allowance amount isn't readable here.

// Status → line-icon + accent. Kept local (the security lib emits string keys).
const STATUS_ICON: Record<CheckStatus, React.ComponentType<{ className?: string }>> = {
  pass: ShieldCheck,
  warn: ShieldAlert,
  fail: ShieldX,
  info: Info,
}
const STATUS_TONE: Record<CheckStatus, string> = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
  info: "text-muted",
}
const STATUS_RING: Record<CheckStatus, string> = {
  pass: "border-emerald-500/20 bg-emerald-500/[0.04]",
  warn: "border-amber-500/20 bg-amber-500/[0.04]",
  fail: "border-red-500/25 bg-red-500/[0.05]",
  info: "border-white/10 bg-white/[0.02]",
}

function gradeTone(score: number): string {
  if (score >= 85) return "text-emerald-400"
  if (score >= 65) return "text-amber-400"
  if (score >= 40) return "text-orange-400"
  return "text-red-400"
}

export function SecurityView() {
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
      <Centered icon={ShieldCheck} title="Connect for your security checkup">
        <p className="text-muted">Your wallet is your login. This checkup reads only your public on-chain history — no keys, no writes.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered icon={ShieldAlert} title="Switch to Arc Testnet">
        <p className="text-muted">Your security checkup runs on Arc. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-white">
          Switch to Arc
        </button>
      </Centered>
    )

  if (loading && !kundli) return <Skeleton />
  if (error)
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <div className="flex justify-center text-red-400"><AlertTriangle className="h-7 w-7" aria-hidden="true" /></div>
        <div className="mt-2 font-semibold">{error}</div>
      </div>
    )
  if (!kundli) return <Skeleton />

  const secInput: SecurityInput = {
    address: kundli.address,
    walletAgeDays: kundli.walletAgeDays,
    isContract: kundli.isContract,
    lastTxDate: kundli.lastTxDate,
    txs: txs ?? [],
  }
  const report = securityReport(secInput)
  const scorable = report.checks.some((c) => c.weight > 0)
  const approvals = approvalActivity(txs ?? [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" /> Security
        </h2>
        <p className="mt-1 text-sm text-muted">
          A read-only checkup of your wallet&apos;s on-chain security posture. Every finding is derived from your real Arc history — nothing fabricated.
        </p>
      </div>

      <PostureCard report={report} scorable={scorable} reduced={reduced} />

      <div className="space-y-3">
        {report.checks.map((c, i) => (
          <CheckRow key={c.id} check={c} index={i} reduced={reduced} />
        ))}
      </div>

      {approvals.length > 0 && <ApprovalList approvals={approvals} reduced={reduced} />}

      <RevokeHint address={kundli.address} />

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

function PostureCard({ report, scorable, reduced }: { report: ReturnType<typeof securityReport>; scorable: boolean; reduced: boolean }) {
  const pct = report.score
  const tone = gradeTone(pct)
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center gap-4 p-6 sm:flex-row sm:gap-6"
    >
      {/* Radial posture gauge */}
      <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`Security posture ${scorable ? `${pct} out of 100` : "not yet scorable"}`}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-white/5" />
          {scorable && (
            <motion.circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
              className={tone}
              stroke="currentColor"
              strokeDasharray={2 * Math.PI * 52}
              initial={reduced ? false : { strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - pct / 100) }}
              transition={reduced ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={"text-2xl font-bold tabular-nums " + (scorable ? tone : "text-muted")}>{scorable ? pct : "—"}</span>
          {scorable && <span className="text-[10px] uppercase tracking-wide text-muted">/ 100</span>}
        </div>
      </div>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <span className={"text-lg font-bold " + (scorable ? tone : "text-muted")}>{scorable ? report.grade : "Building history"}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{report.summary}</p>
        <p className="mt-2 text-xs text-muted">
          Based on your {report.sampleSize} most recent {report.sampleSize === 1 ? "transaction" : "transactions"}. Read-only — this checkup never moves funds or signs anything.
        </p>
      </div>
    </motion.div>
  )
}

function CheckRow({ check, index, reduced }: { check: SecurityCheck; index: number; reduced: boolean }) {
  const Icon = STATUS_ICON[check.status]
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : Math.min(index * 0.04, 0.24) }}
      className={"flex items-start gap-3 rounded-xl border p-4 " + STATUS_RING[check.status]}
    >
      <Icon className={"mt-0.5 h-5 w-5 shrink-0 " + STATUS_TONE[check.status]} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{check.label}</span>
          <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + STATUS_TONE[check.status]}>
            {check.status}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{check.detail}</p>
      </div>
    </motion.div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return "date unknown"
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "date unknown"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// The real approval transactions detected in the sample, made actionable. We
// list each detected approval call with its explorer link so the user can
// inspect and revoke it. We NEVER show an allowance amount — it isn't readable
// from this view — only the on-chain facts we actually have.
function ApprovalList({ approvals, reduced }: { approvals: ArcTx[]; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-amber-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Detected approval activity</h3>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
          {approvals.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Approval calls found in your recent transactions. Each grants a contract standing permission to move your tokens. The remaining allowance can&apos;t be read here — open any transaction to inspect and, if unneeded, revoke it.
      </p>
      <ul className="mt-4 space-y-2">
        {approvals.map((t, i) => (
          <motion.li
            key={t.hash || i}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : Math.min(i * 0.04, 0.24) }}
            className="flex items-center gap-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{t.method ?? "Approval"}</span>
                {t.status === "error" && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">failed</span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {t.to ? <>to {shortAddr(t.to)} · </> : null}{fmtDate(t.timestamp)}
              </div>
            </div>
            {t.hash && (
              <a
                href={`${ARCSCAN_URL}/tx/${t.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Inspect <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

function RevokeHint({ address }: { address: string }) {
  return (
    <div className="glass p-4 text-xs text-muted">
      <p>
        <span className="font-semibold text-foreground">Manage approvals directly:</span> this checkup flags approval activity but can&apos;t read remaining allowances or revoke them for you. Review your address on the explorer to inspect and manage token permissions.
      </p>
      <a
        href={`${ARCSCAN_URL}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
      >
        Open on ArcScan <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-hidden="true">
      <div className="glass flex items-center gap-6 p-6">
        <span className="shimmer block h-28 w-28 rounded-full" />
        <div className="flex-1 space-y-3">
          <span className="shimmer block h-5 w-32 rounded" />
          <span className="shimmer block h-3 w-full rounded" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass flex items-start gap-3 p-4">
          <span className="shimmer block h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <span className="shimmer block h-3 w-40 rounded" />
            <span className="shimmer block h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 pt-24 text-center">
      {Icon && <div className="floaty text-primary"><Icon className="h-12 w-12" aria-hidden="true" /></div>}
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}

