"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Wallet, RefreshCw, AlertTriangle, Send, Coins, ExternalLink, TrendingUp, TrendingDown, Copy, Check } from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { Portfolio, Holding } from "@/lib/arc"
import { fmtAmount, tokenInitials, sortHoldings, assetCount, balanceDelta, portfolioSummary, fmtShare } from "@/lib/portfolio"
import type { BalanceSnapshot, BalanceDelta, PortfolioSummary } from "@/lib/portfolio"
import { Composition } from "@/components/portfolio/Composition"
import { shortAddr } from "@/lib/transfer"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, stagger } from "@/lib/motion"

// Portfolio — read-only holdings for the connected wallet (File 04). Native
// USDC balance + ERC-20 token balances from the free ArcScan v2 API. AETHER
// never writes here; Send routes to the self-custody Transfer flow.

const EXPLORER = "https://testnet.arcscan.app"
const SNAP_PREFIX = "aether.portfolio.snap."

// Read the last stored native-balance snapshot for an address (per-wallet).
function readSnapshot(address: string): BalanceSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAP_PREFIX + address.toLowerCase())
    if (!raw) return null
    const s = JSON.parse(raw) as BalanceSnapshot
    return Number.isFinite(s?.nativeUSDC) ? s : null
  } catch {
    return null
  }
}

function writeSnapshot(address: string, nativeUSDC: number) {
  try {
    localStorage.setItem(SNAP_PREFIX + address.toLowerCase(), JSON.stringify({ nativeUSDC, at: Date.now() }))
  } catch {
    /* storage unavailable; the delta is a nicety, not load-bearing */
  }
}

// Human "3d ago" / "2h ago" for the snapshot age.
function sinceLabel(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function PortfolioView() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [data, setData] = React.useState<Portfolio | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [delta, setDelta] = React.useState<BalanceDelta | null>(null)

  const load = React.useCallback(() => {
    if (!address || !isConnected || !onArc) {
      setData(null)
      return () => {}
    }
    let alive = true
    setLoading(true)
    setError(null)
    fetch(`/api/portfolio?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.error) {
          setError(d.error)
        } else {
          const p = d as Portfolio
          setData(p)
          // Compare against the prior snapshot (real change since last look),
          // then record the current balance for next time.
          setDelta(balanceDelta(readSnapshot(address), p.nativeUSDC, Date.now()))
          writeSnapshot(address, p.nativeUSDC)
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

  React.useEffect(() => load(), [load])

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to see what you hold">
        <p className="text-silver">Your wallet is your login. This is a read-only view of what you hold on Arc.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Your holdings live on Arc. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  const holdings = data ? sortHoldings(data.holdings) : []
  const summary = data ? portfolioSummary(data.holdings) : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div {...rise(reduced, 0.05)} className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Holdings</p>
          <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">What you hold on Arc.</h1>
          <p className="mt-3 text-sm text-silver">Your balances on Arc Testnet. Read-only.</p>
          {address && <WalletChip address={address} />}
        </div>
        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh portfolio"
          className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm text-silver-dim transition hover:border-hairline-strong hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} aria-hidden="true" /> Refresh
        </button>
      </motion.div>

      {/* Headline native balance */}
      <motion.div {...rise(reduced, 0.1)} className="card-primary p-6">
        <div className="eyebrow">Native balance · spendable</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="champagne-sheen numeric text-4xl font-bold">{data ? fmtAmount(data.nativeUSDC) : "—"}</span>
          <span className="text-lg font-semibold text-silver">USDC</span>
        </div>
        {delta && Math.abs(delta.delta) > 1e-9 && (
          <div className={"mt-2 inline-flex items-center gap-1.5 text-xs " + (delta.delta > 0 ? "text-positive" : "text-negative")}>
            {delta.delta > 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
            <span className="numeric font-semibold">{delta.delta > 0 ? "+" : ""}{fmtAmount(delta.delta)} USDC</span>
            <span className="text-silver-dim">since {sinceLabel(delta.sinceMs)}</span>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <Link href="/transfer" className="btn-champagne inline-flex items-center gap-2 px-6 py-2.5 text-sm">
            <Send className="h-4 w-4" aria-hidden="true" /> Send
          </Link>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium">
            Get test USDC
          </a>
        </div>
      </motion.div>

      {/* At-a-glance summary — every figure derived from real balances */}
      {summary && summary.hasHoldings && <SummaryStrip summary={summary} reduced={reduced} />}

      {/* Composition — how holdings are distributed (by token amount) */}
      <Composition data={data} />

      {/* Holdings list */}
      <div>
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Coins className="h-3 w-3 text-champagne" aria-hidden="true" /> Assets
          {data && <span className="font-normal normal-case tracking-normal text-silver-dim">({assetCount(data.holdings)})</span>}
        </p>

        {loading && !data ? (
          <ListSkeleton />
        ) : error ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/[0.06] p-4 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : data && assetCount(data.holdings) === 0 ? (
          <div className="card-quiet flex items-start gap-3 p-5 text-sm text-silver">
            <Coins className="mt-0.5 h-4 w-4 shrink-0 text-silver-dim" aria-hidden="true" />
            <span>
              This wallet holds nothing on Arc yet. Grab some test USDC to get started — AetherFI shows only what's
              really on-chain, never a placeholder balance.
            </span>
          </div>
        ) : (
          <ul className="space-y-2">
            {holdings.map((h, i) => (
              <Row key={(h.contract ?? h.symbol) + i} h={h} reduced={reduced} index={i} />
            ))}
          </ul>
        )}
      </div>

      <Link href="/dashboard" className="inline-block text-sm text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
        ← Back to dashboard
      </Link>
    </div>
  )
}

// Connected-wallet address chip — copy to clipboard + open on ArcScan. Shows
// the real address only; no ENS or label is invented when none exists.
function WalletChip({ address }: { address: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = React.useCallback(() => {
    navigator.clipboard?.writeText(address).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      },
      () => {},
    )
  }, [address])

  return (
    <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-hairline bg-champagne/[0.03] py-1 pl-3 pr-1 text-xs">
      <span className="font-mono text-silver">{shortAddr(address)}</span>
      <button
        onClick={copy}
        aria-label={copied ? "Address copied" : "Copy address"}
        className="flex h-6 w-6 items-center justify-center rounded-full text-silver-dim transition hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-positive" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <a
        href={`${EXPLORER}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View wallet on ArcScan"
        className="flex h-6 w-6 items-center justify-center rounded-full text-silver-dim transition hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}

// At-a-glance summary — distinct assets, token count, and the native USDC slice
// of total holdings. Every figure is computed from real balances by
// portfolioSummary(); the native share is by TOKEN AMOUNT (never a USD value).
function SummaryStrip({ summary, reduced }: { summary: PortfolioSummary; reduced: boolean }) {
  return (
    <motion.div {...rise(reduced, 0.12)} className="grid grid-cols-3 gap-3">
      <Stat label="Assets held" value={summary.assetCount.toLocaleString("en-US")} />
      <Stat label="Tokens" value={summary.tokenCount.toLocaleString("en-US")} hint="excl. native" />
      <Stat label="Native share" value={fmtShare(summary.nativeShare)} hint="of holdings" />
    </motion.div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-quiet p-4">
      <div className="eyebrow !text-[10px]">{label}</div>
      <div className="numeric mt-1.5 text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-silver-dim">{hint}</div>}
    </div>
  )
}

function Row({ h, reduced, index }: { h: Holding; reduced: boolean; index: number }) {
  return (
    <motion.li {...stagger(reduced, index, 0.03)} className="card-quiet flex items-center gap-4 p-4 transition-colors hover:border-hairline-strong">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne/[0.06] text-xs font-semibold text-silver">
        {tokenInitials(h.symbol)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{h.symbol}</span>
          {h.isNative && <span className="rounded-full border border-champagne/30 px-1.5 py-0.5 text-[10px] uppercase text-champagne">Native</span>}
        </div>
        <div className="truncate text-xs text-silver-dim">{h.name}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="numeric font-semibold text-foreground">{fmtAmount(h.amount)}</div>
        {h.contract && (
          <a
            href={`${EXPLORER}/token/${h.contract}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-silver-dim underline decoration-hairline-strong underline-offset-2 transition hover:text-foreground hover:decoration-champagne"
          >
            {shortAddr(h.contract)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </motion.li>
  )
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="card-quiet flex items-center gap-4 p-4">
          <span className="shimmer h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <span className="shimmer block h-3 w-24 rounded" />
            <span className="shimmer block h-3 w-40 rounded" />
          </div>
          <span className="shimmer h-4 w-16 rounded" />
        </li>
      ))}
    </ul>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow flex items-center gap-2">
        {Icon && <Icon className="h-3 w-3 text-champagne" aria-hidden="true" />} Holdings
      </p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-5xl">{title}</h2>
      {children}
    </div>
  )
}
