"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Repeat, ArrowDown, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Info, Wallet,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { Portfolio } from "@/lib/arc"
import { fmtAmount, tokenInitials, sortHoldings } from "@/lib/portfolio"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise } from "@/lib/motion"
import {
  getSwapRouter, swapTokensFromHoldings, tokenKey, validateSwap,
  fmtSlippage, SLIPPAGE_OPTIONS_BPS, DEFAULT_SLIPPAGE_BPS,
  swapReducer, initialSwapState, isBusy, canSign,
  type SwapToken, type SwapState,
} from "@/lib/swap"

// Swap — exchange one Arc asset for another. Built entirely on the current
// AetherFI design system (obsidian / champagne / hairline), reusing the same
// shell, motion (lib/motion), and holdings source (/api/portfolio) as Portfolio.
//
// All routing lives behind lib/swap's adapter. No DEX is deployed on Arc Testnet
// yet, so the default router honestly reports "unavailable" — this screen NEVER
// shows a fabricated quote. When a real router is connected in getSwapRouter(),
// the "unavailable" branch simply becomes a live quote and the review + sign
// path below activates, with no change to this component. AetherFI never signs
// for you: you would review a real quote and sign in your own wallet.

const EXPLORER = "https://testnet.arcscan.app"

export function SwapView() {
  const { isConnected } = useAccount()
  const address = useAccount().address
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  // Real holdings — the swap's token universe and balances.
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
  const tokens = React.useMemo(() => swapTokensFromHoldings(holdings), [holdings])

  // Swap inputs.
  const [fromKey, setFromKey] = React.useState<string | null>(null)
  const [toKey, setToKey] = React.useState<string | null>(null)
  const [amountIn, setAmountIn] = React.useState("")
  const [slippageBps, setSlippageBps] = React.useState<number>(DEFAULT_SLIPPAGE_BPS)

  // Lifecycle state machine (pure reducer from lib/swap).
  const [state, dispatch] = React.useReducer(swapReducer, initialSwapState)

  // Default the token pair once holdings arrive: native as `from`, next as `to`.
  React.useEffect(() => {
    if (tokens.length === 0 || fromKey) return
    setFromKey(tokenKey(tokens[0]))
    if (tokens.length > 1) setToKey(tokenKey(tokens[1]))
  }, [tokens, fromKey])

  const from = tokens.find((t) => tokenKey(t) === fromKey) ?? null
  const to = tokens.find((t) => tokenKey(t) === toKey) ?? null
  const fromBalance =
    from ? holdings.find((h) => tokenKey({ symbol: h.symbol, name: h.name, contract: h.contract, decimals: h.decimals }) === fromKey)?.amount ?? 0 : 0

  const validation = validateSwap(amountIn, from, to, fromBalance)

  // Any input edit invalidates a stale quote (reducer returns to idle).
  function onInputChange(fn: () => void) {
    fn()
    dispatch({ type: "INPUT_CHANGED" })
  }

  function swapDirection() {
    onInputChange(() => {
      setFromKey(toKey)
      setToKey(fromKey)
      setAmountIn("")
    })
  }

  // Ask the router for a real quote. The adapter decides ok / unavailable /
  // error — this never synthesizes a number.
  const requestQuote = React.useCallback(async () => {
    if (!from || !to || !validation.ready) return
    dispatch({ type: "QUOTE_REQUESTED" })
    try {
      const router = getSwapRouter()
      const outcome = await router.quote({
        from,
        to,
        amountIn: Number(amountIn),
        slippageBps,
      })
      dispatch({ type: "QUOTE_RESULT", outcome })
    } catch {
      dispatch({ type: "FAILED", message: "Could not reach the swap router. Try again." })
    }
  }, [from, to, amountIn, slippageBps, validation.ready])

  // Sign path — only reachable once a real quote exists. A connected router
  // returns an unsigned tx here for the user to sign in their own wallet; with
  // no router deployed, this branch is never reached from the UI.
  async function signSwap() {
    if (!canSign(state.phase) || !state.quote) return
    dispatch({ type: "SIGN_STARTED" })
    dispatch({
      type: "FAILED",
      message: "Signing is enabled once a live Arc router is connected. Nothing was sent.",
    })
  }

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to swap on Arc.">
        <p className="text-silver">Your wallet is your login. You review and sign every swap yourself — AetherFI never holds or moves your funds.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Swaps happen on Arc Testnet. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  if (state.phase === "success")
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Header />
        <SuccessCard state={state} from={from} to={to} amountIn={amountIn} onReset={() => dispatch({ type: "RESET" })} reduced={reduced} />
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
      ) : tokens.length === 0 ? (
        <EmptyHoldings />
      ) : (
        <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-6">
          {/* From */}
          <TokenField
            label="You pay"
            tokens={tokens}
            selectedKey={fromKey}
            onSelect={(k) => onInputChange(() => setFromKey(k))}
            excludeKey={toKey}
            amount={amountIn}
            onAmount={(v) => onInputChange(() => setAmountIn(v))}
            balance={fromBalance}
            editable
            disabled={busy}
            invalid={amountIn.length > 0 && (!validation.amountValid || !validation.withinBalance)}
          />

          {/* Direction toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapDirection}
              disabled={busy}
              aria-label="Swap direction"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-graphite text-silver transition hover:border-hairline-strong hover:text-foreground disabled:opacity-50"
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* To */}
          <TokenField
            label="You receive"
            tokens={tokens}
            selectedKey={toKey}
            onSelect={(k) => onInputChange(() => setToKey(k))}
            excludeKey={fromKey}
            amount={state.quote ? fmtAmount(state.quote.amountOut) : ""}
            balance={null}
            editable={false}
            disabled={busy}
          />

          <SlippageRow value={slippageBps} onChange={(b) => onInputChange(() => setSlippageBps(b))} disabled={busy} />

          {validation.reason && amountIn.length > 0 && (
            <p className="text-xs text-caution">{validation.reason}</p>
          )}

          {/* Real quote review — only shown when a router priced it */}
          {state.phase === "quoted" && state.quote && (
            <QuoteReview state={state} />
          )}

          {/* Honest unavailable state — no router deployed yet */}
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

          {/* Primary action — get a quote, or (once a router is live) sign it */}
          {canSign(state.phase) ? (
            <button onClick={signSwap} disabled={busy} className="btn-champagne w-full px-6 py-3 text-sm disabled:opacity-50">
              Review &amp; sign in wallet
            </button>
          ) : (
            <button
              onClick={requestQuote}
              disabled={!validation.ready || busy}
              className="btn-champagne w-full px-6 py-3 text-sm disabled:opacity-50"
            >
              {state.phase === "quoting" ? "Finding the best route…" : "Get quote"}
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
        <Repeat className="h-3 w-3 text-champagne" aria-hidden="true" /> Swap
      </p>
      <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Exchange assets on Arc.</h1>
      <p className="mt-3 text-sm text-silver">Swap one Arc asset for another. You review a real quote and sign in your own wallet — AetherFI never holds or moves your funds.</p>
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

// A token row: a native <select> (no dependency) + an amount. When editable the
// amount is a real numeric input with a Max button; otherwise it mirrors the
// quoted output — which stays "—" until a router prices it (never fabricated).
function TokenField({
  label,
  tokens,
  selectedKey,
  onSelect,
  excludeKey,
  amount,
  onAmount,
  balance,
  editable,
  disabled,
  invalid,
}: {
  label: string
  tokens: SwapToken[]
  selectedKey: string | null
  onSelect: (key: string) => void
  excludeKey: string | null
  amount: string
  onAmount?: (v: string) => void
  balance: number | null
  editable: boolean
  disabled?: boolean
  invalid?: boolean
}) {
  const selected = tokens.find((t) => tokenKey(t) === selectedKey) ?? null
  const options = tokens.filter((t) => !excludeKey || tokenKey(t) !== excludeKey || tokenKey(t) === selectedKey)

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        invalid ? "border-negative/40 bg-negative/[0.04]" : "border-hairline bg-graphite/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow !text-[10px]">{label}</span>
        {balance !== null && selected && (
          <span className="text-[11px] text-silver-dim">
            Balance {fmtAmount(balance)} {selected.symbol}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        {editable ? (
          <input
            inputMode="decimal"
            value={amount}
            disabled={disabled}
            onChange={(e) => onAmount?.(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            aria-label={`${label} amount`}
            className="numeric min-w-0 flex-1 bg-transparent text-2xl text-ivory outline-none placeholder:text-silver-dim disabled:opacity-60"
          />
        ) : (
          <span className="numeric min-w-0 flex-1 truncate text-2xl text-ivory">{amount || "—"}</span>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {editable && balance !== null && balance > 0 && (
            <button
              type="button"
              onClick={() => onAmount?.(String(balance))}
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
              aria-label={`${label} token`}
              className="cursor-pointer bg-transparent py-1.5 text-sm text-foreground outline-none disabled:opacity-60"
            >
              {options.map((t) => (
                <option key={tokenKey(t)} value={tokenKey(t)} className="bg-graphite text-foreground">
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlippageRow({ value, onChange, disabled }: { value: number; onChange: (bps: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-xs text-silver-dim">Max slippage</span>
      <div className="flex gap-1.5" role="group" aria-label="Max slippage">
        {SLIPPAGE_OPTIONS_BPS.map((bps) => {
          const active = value === bps
          return (
            <button
              key={bps}
              type="button"
              onClick={() => onChange(bps)}
              disabled={disabled}
              aria-pressed={active}
              className={`rounded-md border px-2.5 py-1 text-[11px] transition disabled:opacity-50 ${
                active
                  ? "border-champagne/50 bg-champagne/10 text-champagne"
                  : "border-hairline text-silver-dim hover:border-hairline-strong hover:text-foreground"
              }`}
            >
              {fmtSlippage(bps)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Renders a REAL router quote only. Every number here comes from state.quote,
// which is populated exclusively by getSwapRouter().quote().
function QuoteReview({ state }: { state: SwapState }) {
  const q = state.quote
  if (!q) return null
  return (
    <dl className="space-y-1.5 rounded-xl border border-hairline bg-graphite/40 p-4 text-sm">
      <Row label="Rate">
        1 {q.from.symbol} ≈ {fmtAmount(q.rate)} {q.to.symbol}
      </Row>
      <Row label="Minimum received">
        {fmtAmount(q.minReceived)} {q.to.symbol}
      </Row>
      <Row label="Max slippage">{fmtSlippage(q.slippageBps)}</Row>
      {q.priceImpactBps !== null && <Row label="Price impact">{fmtSlippage(q.priceImpactBps)}</Row>}
      <Row label="Route">{q.routerId}</Row>
    </dl>
  )
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
  quoting: "Finding the best route…",
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
  from,
  to,
  amountIn,
  onReset,
  reduced,
}: {
  state: SwapState
  from: SwapToken | null
  to: SwapToken | null
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
        <h2 className="display text-xl text-ivory">Swap confirmed.</h2>
        <p className="numeric mt-2 text-sm text-silver">
          {amountIn} {from?.symbol} → {state.quote ? fmtAmount(state.quote.amountOut) : ""} {to?.symbol}
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
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> New swap
      </button>
    </motion.div>
  )
}

function EmptyHoldings() {
  const reduced = useReducedMotion()
  return (
    <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-graphite">
        <Repeat className="h-5 w-5 text-silver-dim" aria-hidden="true" />
      </span>
      <h2 className="text-base text-foreground">Nothing to swap yet.</h2>
      <p className="mx-auto max-w-sm text-sm text-silver">
        You need at least two assets on Arc to swap between them. Add funds to your wallet and they’ll appear here automatically.
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
