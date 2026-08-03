"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Waypoints, ArrowDown, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Info, Wallet,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { Portfolio } from "@/lib/arc"
import { fmtAmount, tokenInitials, sortHoldings } from "@/lib/portfolio"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise } from "@/lib/motion"
import {
  getBridgeRouter, bridgeAssetsFromHoldings, assetKey, validateBridge,
  ARC_CHAIN, BRIDGE_DESTINATIONS, DEFAULT_DESTINATION_ID, chainById,
  bridgeReducer, initialBridgeState, isBusy, canSign,
  type BridgeAsset, type BridgeChain, type BridgeState,
} from "@/lib/bridge"

// Bridge — move an Arc asset to another network. Built entirely on the current
// AetherFI design system and mirroring components/swap/SwapView: same shell,
// motion (lib/motion), holdings source (/api/portfolio) and connect/switch
// gates. All routing lives behind lib/bridge's adapter. No canonical bridge is
// deployed for Arc Testnet yet, so the default router honestly reports
// "unavailable" — this screen NEVER shows a fabricated route, fee or ETA. When
// a real bridge is connected in getBridgeRouter(), the review + sign path
// activates with no change to this component. AetherFI never signs for you.

const EXPLORER = "https://testnet.arcscan.app"

export function BridgeView() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  // Real holdings — the bridge's asset universe and balances.
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
  const assets = React.useMemo(() => bridgeAssetsFromHoldings(holdings), [holdings])

  // Bridge inputs. Source is fixed to Arc; destination is chosen.
  const [assetKeyState, setAssetKeyState] = React.useState<string | null>(null)
  const [toChainId, setToChainId] = React.useState<number>(DEFAULT_DESTINATION_ID)
  const [amountIn, setAmountIn] = React.useState("")

  const [state, dispatch] = React.useReducer(bridgeReducer, initialBridgeState)

  // Default the asset once holdings arrive (native first, via sortHoldings).
  React.useEffect(() => {
    if (assets.length === 0 || assetKeyState) return
    setAssetKeyState(assetKey(assets[0]))
  }, [assets, assetKeyState])

  const asset = assets.find((a) => assetKey(a) === assetKeyState) ?? null
  const fromChain = ARC_CHAIN
  const toChain = chainById(toChainId)
  const balance =
    asset
      ? holdings.find(
          (h) => assetKey({ symbol: h.symbol, name: h.name, contract: h.contract, decimals: h.decimals }) === assetKeyState,
        )?.amount ?? 0
      : 0

  const validation = validateBridge(amountIn, asset, fromChain, toChain, balance)

  function onInputChange(fn: () => void) {
    fn()
    dispatch({ type: "INPUT_CHANGED" })
  }

  // Ask the router for a real quote. The adapter decides ok / unavailable /
  // error — this never synthesizes a route, fee or ETA.
  const requestQuote = React.useCallback(async () => {
    if (!asset || !toChain || !validation.ready) return
    dispatch({ type: "QUOTE_REQUESTED" })
    try {
      const router = getBridgeRouter()
      const outcome = await router.quote({ asset, fromChain: ARC_CHAIN, toChain, amountIn: Number(amountIn) })
      dispatch({ type: "QUOTE_RESULT", outcome })
    } catch {
      dispatch({ type: "FAILED", message: "Could not reach the bridge router. Try again." })
    }
  }, [asset, toChain, amountIn, validation.ready])

  // Sign path — only reachable once a real quote exists. With no bridge
  // deployed, this branch is never reached from the UI.
  function signBridge() {
    if (!canSign(state.phase) || !state.quote) return
    dispatch({ type: "SIGN_STARTED" })
    dispatch({
      type: "FAILED",
      message: "Signing is enabled once a live Arc bridge is connected. Nothing was sent.",
    })
  }

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to bridge from Arc.">
        <p className="text-silver">Your wallet is your login. You review and sign every bridge transfer yourself — AetherFI never holds or moves your funds.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Bridges start from Arc Testnet. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  if (state.phase === "success")
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Header />
        <SuccessCard state={state} asset={asset} toChain={toChain} amountIn={amountIn} onReset={() => dispatch({ type: "RESET" })} reduced={reduced} />
        <BackLink />
      </div>
    )

  const busy = isBusy(state.phase)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Header />

      {loadingHoldings && !portfolio ? (
        <FormSkeleton />
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
        <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-6">
          {/* From — source chain fixed to Arc, with the asset + amount */}
          <SourceField
            assets={assets}
            selectedKey={assetKeyState}
            onSelect={(k) => onInputChange(() => setAssetKeyState(k))}
            amount={amountIn}
            onAmount={(v) => onInputChange(() => setAmountIn(v))}
            balance={balance}
            disabled={busy}
            invalid={amountIn.length > 0 && (!validation.amountValid || !validation.withinBalance)}
          />

          {/* Direction indicator (bridges are one-way: Arc → destination) */}
          <div className="flex justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-graphite text-silver" aria-hidden="true">
              <ArrowDown className="h-4 w-4" />
            </span>
          </div>

          {/* To — destination chain; the received amount stays "—" until priced */}
          <DestinationField
            toChainId={toChainId}
            onSelect={(id) => onInputChange(() => setToChainId(id))}
            asset={asset}
            amount={state.quote ? fmtAmount(state.quote.amountOut) : ""}
            disabled={busy}
          />

          {validation.reason && amountIn.length > 0 && (
            <p className="text-xs text-caution">{validation.reason}</p>
          )}

          {/* Real quote review — only shown when a router priced it */}
          {state.phase === "quoted" && state.quote && <QuoteReview state={state} />}

          {/* Honest unavailable state — no bridge deployed yet */}
          {state.phase === "unavailable" && state.message && (
            <div className="flex items-start gap-2 rounded-xl border border-hairline bg-champagne/[0.04] p-4 text-sm text-silver" role="status">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          )}

          {state.phase === "error" && state.message && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/[0.06] p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
              <span>{state.message}</span>
            </div>
          )}

          {busy && <BusyRow phase={state.phase} txHash={state.txHash} />}

          {canSign(state.phase) ? (
            <button onClick={signBridge} disabled={busy} className="btn-champagne w-full px-6 py-3 text-sm disabled:opacity-50">
              Review &amp; sign in wallet
            </button>
          ) : (
            <button
              onClick={requestQuote}
              disabled={!validation.ready || busy}
              className="btn-champagne w-full px-6 py-3 text-sm disabled:opacity-50"
            >
              {state.phase === "quoting" ? "Finding a route…" : "Get estimate"}
            </button>
          )}
        </motion.div>
      )}

      <BackLink />
    </div>
  )
}

function Header() {
  return (
    <div>
      <p className="eyebrow flex items-center gap-2">
        <Waypoints className="h-3 w-3 text-champagne" aria-hidden="true" /> Bridge
      </p>
      <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Move assets across networks.</h1>
      <p className="mt-3 text-sm text-silver">Bridge an asset from Arc to another network. You review a real estimate and sign in your own wallet — AetherFI never holds or moves your funds.</p>
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

// Source row: fixed Arc network label + an asset <select> and a real amount
// input with a Max button.
function SourceField({
  assets,
  selectedKey,
  onSelect,
  amount,
  onAmount,
  balance,
  disabled,
  invalid,
}: {
  assets: BridgeAsset[]
  selectedKey: string | null
  onSelect: (key: string) => void
  amount: string
  onAmount: (v: string) => void
  balance: number
  disabled?: boolean
  invalid?: boolean
}) {
  const selected = assets.find((a) => assetKey(a) === selectedKey) ?? null
  return (
    <div className={`rounded-xl border p-4 transition-colors ${invalid ? "border-negative/40 bg-negative/[0.04]" : "border-hairline bg-graphite/40"}`}>
      <div className="flex items-center justify-between">
        <span className="eyebrow !text-[10px]">From {ARC_CHAIN.name}</span>
        {selected && (
          <span className="text-[11px] text-silver-dim">
            Balance {fmtAmount(balance)} {selected.symbol}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          inputMode="decimal"
          value={amount}
          disabled={disabled}
          onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          aria-label="Bridge amount"
          className="numeric min-w-0 flex-1 bg-transparent text-2xl text-ivory outline-none placeholder:text-silver-dim disabled:opacity-60"
        />
        <div className="flex shrink-0 items-center gap-2">
          {balance > 0 && (
            <button
              type="button"
              onClick={() => onAmount(String(balance))}
              disabled={disabled}
              className="rounded-md border border-hairline px-2 py-1 text-[10px] uppercase tracking-wide text-silver-dim transition hover:border-champagne hover:text-champagne disabled:opacity-50"
            >
              Max
            </button>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-obsidian/60 pl-1 pr-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne/10 text-[10px] font-medium text-champagne">
              {selected ? tokenInitials(selected.symbol) : "?"}
            </span>
            <select
              value={selectedKey ?? ""}
              disabled={disabled}
              onChange={(e) => onSelect(e.target.value)}
              aria-label="Asset to bridge"
              className="cursor-pointer bg-transparent py-1.5 text-sm text-foreground outline-none disabled:opacity-60"
            >
              {assets.map((a) => (
                <option key={assetKey(a)} value={assetKey(a)} className="bg-graphite text-foreground">
                  {a.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Destination row: a chain <select> + the received amount (mirrors the quoted
// output, which stays "—" until a router prices it — never fabricated).
function DestinationField({
  toChainId,
  onSelect,
  asset,
  amount,
  disabled,
}: {
  toChainId: number
  onSelect: (id: number) => void
  asset: BridgeAsset | null
  amount: string
  disabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-hairline bg-graphite/40 p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow !text-[10px]">To network</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="numeric min-w-0 flex-1 truncate text-2xl text-ivory">{amount || "—"}</span>
        <div className="flex shrink-0 items-center gap-2">
          {asset && <span className="text-[11px] text-silver-dim">{asset.symbol}</span>}
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-obsidian/60 px-2">
            <select
              value={toChainId}
              disabled={disabled}
              onChange={(e) => onSelect(Number(e.target.value))}
              aria-label="Destination network"
              className="cursor-pointer bg-transparent py-1.5 text-sm text-foreground outline-none disabled:opacity-60"
            >
              {BRIDGE_DESTINATIONS.map((c) => (
                <option key={c.id} value={c.id} className="bg-graphite text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Renders a REAL router quote only. Every number comes from state.quote.
function QuoteReview({ state }: { state: BridgeState }) {
  const q = state.quote
  if (!q) return null
  return (
    <dl className="space-y-1.5 rounded-xl border border-hairline bg-graphite/40 p-4 text-sm">
      <Row label="Route">
        {q.fromChain.short} → {q.toChain.short}
      </Row>
      <Row label="Bridge fee">
        {fmtAmount(q.fee)} {q.feeSymbol}
      </Row>
      <Row label="Minimum received">
        {fmtAmount(q.minReceived)} {q.asset.symbol}
      </Row>
      {q.estimatedSeconds !== null && <Row label="Estimated arrival">{fmtDuration(q.estimatedSeconds)}</Row>}
      <Row label="Route">{q.routerId}</Row>
    </dl>
  )
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)}s`
  const mins = Math.round(seconds / 60)
  return `~${mins} min`
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-silver-dim">{label}</dt>
      <dd className="numeric text-right text-foreground">{children}</dd>
    </div>
  )
}

const BUSY_LABEL: Record<string, string> = {
  quoting: "Finding a route…",
  signing: "Waiting for your signature…",
  confirming: "Confirming on Arc…",
}

function BusyRow({ phase, txHash }: { phase: string; txHash: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-hairline bg-graphite/40 p-3 text-sm text-silver" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-champagne" aria-hidden="true" />
      <span className="flex-1">{BUSY_LABEL[phase] ?? "Working…"}</span>
      {txHash && (
        <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-champagne underline decoration-hairline-strong underline-offset-4">
          View
        </a>
      )}
    </div>
  )
}

function SuccessCard({
  state,
  asset,
  toChain,
  amountIn,
  onReset,
  reduced,
}: {
  state: BridgeState
  asset: BridgeAsset | null
  toChain: BridgeChain | null
  amountIn: string
  onReset: () => void
  reduced: boolean
}) {
  return (
    <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-5 p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-positive/30 bg-positive/[0.08]">
        <CheckCircle2 className="h-6 w-6 text-positive" aria-hidden="true" />
      </span>
      <div>
        <h2 className="display text-xl text-ivory">Bridge confirmed.</h2>
        <p className="numeric mt-2 text-sm text-silver">
          {amountIn} {asset?.symbol} → {toChain?.name}
        </p>
      </div>
      {state.txHash && (
        <a
          href={`${EXPLORER}/tx/${state.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-champagne underline decoration-hairline-strong underline-offset-4 transition hover:decoration-champagne"
        >
          View on Arcscan
        </a>
      )}
      <button onClick={onReset} className="btn-ghost mx-auto flex items-center gap-2 px-5 py-2.5 text-sm">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> New bridge
      </button>
    </motion.div>
  )
}

function EmptyHoldings() {
  const reduced = useReducedMotion()
  return (
    <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-graphite">
        <Waypoints className="h-5 w-5 text-silver-dim" aria-hidden="true" />
      </span>
      <h2 className="text-base text-foreground">Nothing to bridge yet.</h2>
      <p className="mx-auto max-w-sm text-sm text-silver">
        You need an asset on Arc to bridge it elsewhere. Add funds to your wallet and they’ll appear here automatically.
      </p>
      <Link href="/portfolio" className="inline-block text-sm text-champagne underline decoration-hairline-strong underline-offset-4 transition hover:decoration-champagne">
        View your portfolio →
      </Link>
    </motion.div>
  )
}

function FormSkeleton() {
  return (
    <div className="card-primary space-y-3 p-6" aria-hidden="true">
      <div className="shimmer h-24 rounded-xl" />
      <div className="mx-auto h-9 w-9 rounded-full bg-graphite" />
      <div className="shimmer h-24 rounded-xl" />
      <div className="shimmer h-11 rounded-lg" />
    </div>
  )
}
