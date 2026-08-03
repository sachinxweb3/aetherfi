"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Radio, RefreshCw, AlertTriangle, Loader2, Info, Wallet,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { Portfolio } from "@/lib/arc"
import { tokenInitials, sortHoldings } from "@/lib/portfolio"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, stagger } from "@/lib/motion"
import {
  getOracle, oracleAssetsFromHoldings, quoteFor, fmtUsd, fmtConfidence, fmtAge,
  oracleReducer, initialOracleState, isReading,
  type OracleAsset, type OracleState,
} from "@/lib/oracle"

// Oracle — live price feeds for the assets you hold on Arc. Built entirely on
// the current AetherFI design system and mirroring components/swap/SwapView and
// components/bridge/BridgeView: same shell, motion (lib/motion), holdings source
// (/api/portfolio) and connect/switch gates. All reads live behind lib/oracle's
// adapter. No price oracle is deployed on Arc Testnet yet, so the default feed
// honestly reports "unavailable" — this screen NEVER shows a fabricated price,
// source or confidence. When a real oracle is connected in getOracle(), the
// live-feed table activates with no change to this component.

export function OracleView() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  // Real holdings — the assets the oracle is asked to price.
  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null)
  const [loadingHoldings, setLoadingHoldings] = React.useState(false)
  const [holdingsError, setHoldingsError] = React.useState<string | null>(null)

  const loadHoldings = React.useCallback(() => {
    if (!address || !isConnected || !onArc) {
      setPortfolio(null)
      return () => {}
    }
    let alive = true
    setLoadingHoldings(true)
    setHoldingsError(null)
    fetch(`/api/portfolio?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.error) setHoldingsError(d.error)
        else setPortfolio(d as Portfolio)
        setLoadingHoldings(false)
      })
      .catch(() => {
        if (!alive) return
        setHoldingsError("Could not reach Arc network")
        setLoadingHoldings(false)
      })
    return () => {
      alive = false
    }
  }, [address, isConnected, onArc])

  React.useEffect(() => loadHoldings(), [loadHoldings])

  const holdings = React.useMemo(
    () => (portfolio ? sortHoldings(portfolio.holdings) : []),
    [portfolio],
  )
  const assets = React.useMemo(() => oracleAssetsFromHoldings(holdings), [holdings])

  const [state, dispatch] = React.useReducer(oracleReducer, initialOracleState)

  // Ask the oracle for real prices. The adapter decides ok / unavailable /
  // error — this never synthesizes a price, source or confidence.
  const read = React.useCallback(async () => {
    if (assets.length === 0) return
    dispatch({ type: "READ_REQUESTED" })
    try {
      const oracle = getOracle()
      const outcome = await oracle.read(assets)
      dispatch({ type: "READ_RESULT", outcome })
    } catch {
      dispatch({ type: "FAILED", message: "Could not reach the price oracle. Try again." })
    }
  }, [assets])

  // Read once the assets are known (and on manual refresh below).
  React.useEffect(() => {
    if (assets.length > 0 && state.phase === "idle") read()
  }, [assets, state.phase, read])

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to read Arc price feeds.">
        <p className="text-silver">The Oracle prices the assets you hold on Arc. Your wallet is your login — AetherFI never holds or moves your funds.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Price feeds are read on Arc Testnet. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  const reading = isReading(state.phase)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Header onRefresh={read} refreshing={reading} canRefresh={assets.length > 0} />

      {loadingHoldings && !portfolio ? (
        <TableSkeleton />
      ) : holdingsError ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/[0.06] p-4 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
          <div className="flex-1">
            <span>{holdingsError}</span>
            <button onClick={loadHoldings} className="mt-2 block text-xs text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
              Try again
            </button>
          </div>
        </div>
      ) : assets.length === 0 ? (
        <EmptyHoldings />
      ) : (
        <motion.div {...rise(reduced, 0.05)} className="card-primary p-6">
          {/* Honest unavailable state — no oracle deployed yet */}
          {state.phase === "unavailable" && state.message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-hairline bg-champagne/[0.04] p-4 text-sm text-silver" role="status">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          )}

          {state.phase === "error" && state.message && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/[0.06] p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          )}

          <FeedTable assets={assets} state={state} reading={reading} reduced={reduced} />
        </motion.div>
      )}

      <BackLink />
    </div>
  )
}

function Header({ onRefresh, refreshing, canRefresh }: { onRefresh: () => void; refreshing: boolean; canRefresh: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow flex items-center gap-2">
          <Radio className="h-3 w-3 text-champagne" aria-hidden="true" /> Oracle
        </p>
        <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Live price feeds.</h1>
        <p className="mt-3 text-sm text-silver">Real prices for the assets you hold on Arc — with each feed’s source, confidence and age. AetherFI never invents a price.</p>
      </div>
      {canRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh feeds"
          className="btn-ghost flex shrink-0 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/dashboard" className="inline-block text-sm text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
      ← Back to dashboard
    </Link>
  )
}

function Centered({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div {...rise(reduced, 0.05)} className="mx-auto flex max-w-md flex-col items-center gap-5 py-24 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-graphite">
          <Icon className="h-5 w-5 text-champagne" aria-hidden="true" />
        </span>
      )}
      <h1 className="display text-2xl text-ivory">{title}</h1>
      <div className="flex flex-col items-center gap-4 text-sm">{children}</div>
    </motion.div>
  )
}

// One row per held asset. Price / confidence / source / age come ONLY from a
// live quote; with no oracle connected every value renders "—" and the row
// carries an honest "no live feed" note — never a fabricated number.
function FeedTable({
  assets,
  state,
  reading,
  reduced,
}: {
  assets: OracleAsset[]
  state: OracleState
  reading: boolean
  reduced: boolean
}) {
  // Pure "now" for age formatting, sampled once per render on the client.
  const nowMs = typeof Date !== "undefined" ? Date.now() : 0
  const live = state.phase === "live"

  return (
    <div>
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-hairline pb-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <span className="eyebrow !text-[10px]">Asset</span>
        <span className="eyebrow !text-[10px] text-right">Price</span>
        <span className="eyebrow !text-[10px] text-right">Confidence</span>
        <span className="eyebrow !text-[10px] hidden text-right sm:block">Source · age</span>
      </div>

      <ul className="divide-y divide-hairline">
        {assets.map((a, i) => {
          const q = live ? quoteFor(state.quotes, a) : null
          return (
            <motion.li
              key={a.symbol + i}
              {...stagger(reduced, i)}
              className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 py-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne/10 text-[10px] font-medium text-champagne">
                  {tokenInitials(a.symbol)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{a.symbol}</div>
                  <div className="truncate text-[11px] text-silver-dim">{a.name}</div>
                </div>
              </div>

              <div className="numeric text-right text-sm text-foreground">
                {q ? fmtUsd(q.priceUsd) : <span className="text-silver-dim">—</span>}
              </div>

              <div className="numeric text-right text-sm">
                {q ? (
                  <span className="text-silver">{fmtConfidence(q.confidenceBps)}</span>
                ) : (
                  <span className="text-silver-dim">—</span>
                )}
              </div>

              <div className="hidden text-right text-[11px] sm:block">
                {q ? (
                  <span className="text-silver-dim">
                    {q.source} · {fmtAge(q.updatedAtMs, nowMs)}
                  </span>
                ) : reading ? (
                  <span className="inline-flex items-center gap-1 text-silver-dim">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> reading
                  </span>
                ) : (
                  <span className="text-silver-dim">no live feed</span>
                )}
              </div>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

function EmptyHoldings() {
  const reduced = useReducedMotion()
  return (
    <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-graphite">
        <Radio className="h-5 w-5 text-silver-dim" aria-hidden="true" />
      </span>
      <h2 className="text-base text-foreground">Nothing to price yet.</h2>
      <p className="mx-auto max-w-sm text-sm text-silver">
        The Oracle prices the assets you hold on Arc. Add funds to your wallet and they’ll appear here automatically.
      </p>
      <Link href="/portfolio" className="inline-block text-sm text-champagne underline decoration-hairline-strong underline-offset-4 transition hover:decoration-champagne">
        View your portfolio →
      </Link>
    </motion.div>
  )
}

function TableSkeleton() {
  return (
    <div className="card-primary space-y-3 p-6" aria-hidden="true">
      <div className="shimmer h-4 w-32 rounded" />
      <div className="shimmer h-12 rounded-lg" />
      <div className="shimmer h-12 rounded-lg" />
      <div className="shimmer h-12 rounded-lg" />
    </div>
  )
}
