"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { GitCompareArrows, AlertTriangle, Info, Crown, Loader2, ArrowRight } from "lucide-react"
import type { WalletKundli } from "@/lib/arc"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, stagger } from "@/lib/motion"
import {
  validatePair, isValidAddress, shortAddr,
  compareReducer, initialCompareState, isLoading,
  type CompareState, type CompareMetric, type Side,
} from "@/lib/compare"

// Compare — put two Arc wallets side by side on the SAME real analysis that
// powers the aura, dashboard and Aura Battle (WalletKundli via /api/kundli).
// Built entirely on the current AetherFI design system, shell, motion and
// typography. It never fabricates a metric: each row is a real field from each
// wallet's analysis, and if a wallet's data can't be loaded the flow honestly
// reports unavailable instead of comparing against a stand-in zero.

export function CompareView() {
  const reduced = useReducedMotion()

  const [addrA, setAddrA] = React.useState("")
  const [addrB, setAddrB] = React.useState("")
  const [state, dispatch] = React.useReducer(compareReducer, initialCompareState)

  const validation = validatePair(addrA, addrB)

  function onEdit(fn: () => void) {
    fn()
    dispatch({ type: "INPUT_CHANGED" })
  }

  const runComparison = React.useCallback(async () => {
    if (!validation.ready) return
    dispatch({ type: "COMPARE_REQUESTED" })
    try {
      const [ra, rb] = await Promise.all([
        fetch(`/api/kundli?address=${addrA.trim()}`),
        fetch(`/api/kundli?address=${addrB.trim()}`),
      ])
      const [da, db] = await Promise.all([ra.json(), rb.json()])
      if (!ra.ok || da?.error || !rb.ok || db?.error) {
        dispatch({
          type: "COMPARE_RESULT",
          outcome: {
            status: "unavailable",
            message: "One or both wallets have no readable data on Arc yet. AetherFI won't compare against a fabricated value — try two wallets with on-chain history.",
          },
        })
        return
      }
      dispatch({ type: "COMPARE_RESULT", outcome: { status: "ok", a: da as WalletKundli, b: db as WalletKundli } })
    } catch {
      dispatch({ type: "FAILED", message: "Could not reach Arc to load one or both wallets. Try again." })
    }
  }, [addrA, addrB, validation.ready])

  const busy = isLoading(state.phase)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Header />

      <motion.div {...rise(reduced, 0.05)} className="card-primary space-y-3 p-6">
        <AddressField
          label="Wallet A"
          value={addrA}
          onChange={(v) => onEdit(() => setAddrA(v))}
          disabled={busy}
          invalid={addrA.trim().length > 0 && !isValidAddress(addrA)}
        />
        <div className="flex justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-graphite text-silver">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <AddressField
          label="Wallet B"
          value={addrB}
          onChange={(v) => onEdit(() => setAddrB(v))}
          disabled={busy}
          invalid={addrB.trim().length > 0 && !isValidAddress(addrB)}
        />

        {validation.reason && (addrA.trim().length > 0 || addrB.trim().length > 0) && (
          <p className="text-xs text-caution">{validation.reason}</p>
        )}

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

        <button
          onClick={runComparison}
          disabled={!validation.ready || busy}
          className="btn-champagne flex w-full items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reading both wallets…
            </>
          ) : (
            <>
              Compare wallets <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </motion.div>

      {state.phase === "ready" && state.result && (
        <ComparisonResult state={state} reduced={reduced} />
      )}

      <BackLink />
    </div>
  )
}

function Header() {
  return (
    <header className="space-y-2">
      <div className="eyebrow">Compare</div>
      <h2 className="display text-2xl tracking-wide text-foreground">Two wallets, one honest scorecard</h2>
      <p className="max-w-prose text-sm text-silver">
        Put two Arc wallets side by side on the same real analysis that powers your aura. Every row is a live
        on-chain metric — nothing is invented, and if a wallet has no readable history the comparison says so.
      </p>
    </header>
  )
}

function AddressField({
  label, value, onChange, disabled, invalid,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  invalid?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="eyebrow !text-[10px]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        placeholder="0x…"
        className={cnField(invalid)}
      />
    </label>
  )
}

function cnField(invalid?: boolean): string {
  const base =
    "numeric w-full rounded-xl border bg-graphite px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-silver-dim focus:border-hairline-strong disabled:opacity-50"
  return invalid ? `${base} border-negative/40` : `${base} border-hairline`
}

// ── Result ───────────────────────────────────────────────────────────────────

function ComparisonResult({ state, reduced }: { state: CompareState; reduced: boolean }) {
  const result = state.result!
  const { a, b, metrics, winner, aEdges, bEdges, ties } = result

  return (
    <motion.div {...rise(reduced, 0.08)} className="space-y-4">
      {/* Overall verdict — decided by the canonical aura score, same as Aura Battle */}
      <div className="card-hero space-y-4 p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <WalletHead side="a" address={a.address} score={a.score} won={winner === "a"} tie={winner === "tie"} />
          <span className="eyebrow !text-[10px] text-silver-dim">vs</span>
          <WalletHead side="b" address={b.address} score={b.score} won={winner === "b"} tie={winner === "tie"} />
        </div>
        <p className="text-center text-xs text-silver">
          {winner === "tie"
            ? "Dead heat — both wallets share the same aura score."
            : `${shortAddr(winner === "a" ? a.address : b.address)} leads on aura score.`}{" "}
          Metrics won — A {aEdges} · B {bEdges}
          {ties > 0 ? ` · ${ties} tied` : ""}.
        </p>
      </div>

      {/* Per-metric rows — each one a real WalletKundli field */}
      <div className="card-primary divide-y divide-hairline p-0">
        {metrics.map((m, i) => (
          <MetricRow key={m.key} metric={m} index={i} reduced={reduced} />
        ))}
      </div>
    </motion.div>
  )
}

function WalletHead({
  side, address, score, won, tie,
}: {
  side: Side
  address: string
  score: number
  won: boolean
  tie: boolean
}) {
  return (
    <div className="min-w-0 space-y-1 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {won && !tie && <Crown className="h-4 w-4 text-champagne" aria-hidden="true" />}
        <span className="eyebrow !text-[10px]">{side === "a" ? "Wallet A" : "Wallet B"}</span>
      </div>
      <div className={won && !tie ? "numeric text-2xl text-champagne" : "numeric text-2xl text-foreground"}>
        {Math.round(score).toLocaleString("en-US")}
      </div>
      <div className="truncate text-[11px] text-silver-dim">{shortAddr(address)}</div>
    </div>
  )
}

function MetricRow({ metric, index, reduced }: { metric: CompareMetric; index: number; reduced: boolean }) {
  const aWins = metric.winner === "a"
  const bWins = metric.winner === "b"
  return (
    <motion.div
      {...stagger(reduced, index)}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-3"
    >
      <div className={cellClass(aWins)}>
        <span className="numeric text-sm">{metric.displayA}</span>
        {aWins && <Crown className="ml-1.5 inline h-3 w-3 text-champagne" aria-hidden="true" />}
      </div>
      <div className="text-center text-[10px] uppercase tracking-wide text-silver-dim">{metric.label}</div>
      <div className={`${cellClass(bWins)} text-right`}>
        {bWins && <Crown className="mr-1.5 inline h-3 w-3 text-champagne" aria-hidden="true" />}
        <span className="numeric text-sm">{metric.displayB}</span>
      </div>
    </motion.div>
  )
}

function cellClass(win: boolean): string {
  return win ? "text-champagne" : "text-silver"
}

function BackLink() {
  return (
    <div className="pt-2 text-center">
      <Link href="/dashboard" className="text-xs text-silver-dim transition-colors hover:text-foreground">
        ← Back to dashboard
      </Link>
    </div>
  )
}
