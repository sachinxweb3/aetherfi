"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { PieChart, Info } from "lucide-react"
import type { Portfolio } from "@/lib/arc"
import { allocation, topShare, fmtShare, fmtAmount, tokenInitials } from "@/lib/portfolio"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, EASE } from "@/lib/motion"

// Portfolio composition (File 04) — how a wallet's holdings are distributed.
// HONESTY (File 16): Arc testnet tokens have no price feed, so shares are by
// TOKEN AMOUNT, not USD. We say so plainly rather than invent dollar values.

// A tonal palette inside the AETHER identity: champagne leads, ice and silver
// carry the rest. Native USDC always takes the champagne fill.
const BAR_COLORS = ["#d8c08a", "#9fc1d6", "#9a978d", "#b8975a", "#7fb09a", "#6a6860"]
const NATIVE_FILL = "linear-gradient(90deg,#b8975a,#d8c08a)"

export function Composition({ data }: { data: Portfolio | null }) {
  const reduced = useReducedMotion()
  const rows = React.useMemo(() => (data ? allocation(data.holdings) : []), [data])
  if (!data || rows.length === 0) return null

  const top = rows[0]
  const concentration = topShare(data.holdings)

  return (
    <motion.section {...rise(reduced, 0.05)} className="card-primary p-6">
      <p className="eyebrow flex items-center gap-2">
        <PieChart className="h-3 w-3 text-champagne" aria-hidden="true" /> Composition
        <span className="font-normal normal-case tracking-normal text-silver-dim">by token amount</span>
      </p>

      {/* Concentration insight — honest, computed from real balances. */}
      <p className="mt-3 text-sm leading-relaxed text-silver">
        {rows.length === 1 ? (
          <>Your holdings are entirely <span className="font-semibold text-foreground">{top.symbol}</span>.</>
        ) : (
          <>
            <span className="font-semibold text-foreground">{top.symbol}</span> is your largest position at{" "}
            <span className="font-semibold text-foreground">{fmtShare(concentration)}</span> across {rows.length} assets.
          </>
        )}
      </p>

      {/* Stacked allocation bar */}
      <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-champagne/[0.05]" role="img" aria-label="Allocation by token amount">
        {rows.map((r, i) => (
          <motion.span
            key={(r.contract ?? r.symbol) + i}
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${Math.max(r.share * 100, 0.5)}%` }}
            transition={reduced ? { duration: 0 } : { delay: Math.min(i * 0.05, 0.3), duration: 0.6, ease: EASE }}
            className="h-full"
            style={{ background: r.isNative ? NATIVE_FILL : BAR_COLORS[i % BAR_COLORS.length] }}
            title={`${r.symbol} · ${fmtShare(r.share)}`}
          />
        ))}
      </div>

      {/* Per-asset rows */}
      <ul className="mt-5 space-y-3">
        {rows.map((r, i) => (
          <li key={(r.contract ?? r.symbol) + i} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: r.isNative ? NATIVE_FILL : BAR_COLORS[i % BAR_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne/[0.06] text-[10px] font-semibold text-silver">
              {tokenInitials(r.symbol)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {r.symbol}
                {r.isNative && <span className="rounded-full border border-champagne/30 px-1.5 py-0.5 text-[9px] uppercase text-champagne">Native</span>}
              </div>
              <div className="truncate text-xs text-silver-dim">{r.name}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="numeric text-sm font-semibold text-foreground">{fmtShare(r.share)}</div>
              <div className="numeric text-xs text-silver-dim">{fmtAmount(r.amount)}</div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-start gap-1.5 border-t border-hairline pt-4 text-[11px] leading-relaxed text-silver-dim">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        Shares reflect token amounts, not dollar value. Arc Testnet tokens have no price feed, so AetherFI never estimates USD worth.
      </p>
    </motion.section>
  )
}
