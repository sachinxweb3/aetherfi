import type { WalletKundli, ArcTx } from "@/lib/arc"
import { flowStats, activeStreak, busiestDay, activityTrend, successRate } from "@/lib/analytics"

// Deterministic "AI" insight for the dashboard hero. This is REAL intelligence
// over on-chain facts — a rules engine that reads the wallet's kundli + recent
// transactions and states the single most relevant thing in plain English.
// No paid model, no network, nothing fabricated (File 06 intelligence, File 16
// honesty). Pure + testable.

export interface InsightAction {
  label: string
  href: string
}

export interface Insight {
  headline: string
  detail: string
  tone: "positive" | "neutral" | "caution"
  action?: InsightAction
}

// Priorities, most urgent first: failures → funding → net flow → momentum →
// rank encouragement → cold start. The first matching rule wins so the hero
// always shows the ONE thing that matters most right now.
export function buildInsight(k: WalletKundli, txs: ArcTx[]): Insight {
  const flow = flowStats(txs)
  const streak = activeStreak(k.activityByDay)
  const busy = busiestDay(k.activityByDay)
  const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`

  // 1. Failed transactions are the most actionable signal.
  if (flow.failed > 0) {
    return {
      headline: `${flow.failed} recent ${flow.failed === 1 ? "transaction" : "transactions"} failed`,
      detail: "Check gas and balance before retrying — failed sends still cost gas.",
      tone: "caution",
      action: { label: "Review & retry", href: "/activity" },
    }
  }

  // 2. No balance yet → funding is the next step.
  if (k.balanceUSDC <= 0) {
    return {
      headline: "Fund your wallet to get started",
      detail: "Grab test USDC from the faucet, then make your first transfer on Arc.",
      tone: "neutral",
      action: { label: "Make a transfer", href: "/transfer" },
    }
  }

  // 3. Meaningful net flow over the recent sample.
  if (flow.sampleSize >= 3 && Math.abs(flow.net) >= 0.01) {
    const up = flow.net > 0
    return {
      headline: up ? `Net inflow of ${money(flow.net)}` : `Net outflow of ${money(Math.abs(flow.net))}`,
      detail: up
        ? `You received ${money(flow.totalIn)} and sent ${money(flow.totalOut)} across your last ${flow.sampleSize} transactions.`
        : `You sent ${money(flow.totalOut)} and received ${money(flow.totalIn)} across your last ${flow.sampleSize} transactions.`,
      tone: up ? "positive" : "neutral",
      action: { label: "See analytics", href: "/analytics" },
    }
  }

  // 4. Active streak momentum.
  if (streak >= 3) {
    return {
      headline: `You're on a ${streak}-day activity streak`,
      detail: busy && busy.count > 0 ? `Your busiest recent day saw ${busy.count} transactions.` : "Keep the momentum going.",
      tone: "positive",
      action: { label: "View activity", href: "/activity" },
    }
  }

  // 5. Rank encouragement when the score is climbing but not maxed.
  if (k.score >= 200 && k.score < 800) {
    return {
      headline: `You rank as ${k.rank}`,
      detail: `You're ahead of ${k.percentile}% of Arc wallets. More activity lifts your aura score.`,
      tone: "positive",
      action: { label: "See breakdown", href: "/analytics" },
    }
  }

  // 6. Cold start / quiet wallet.
  return {
    headline: "Your Arc journey is just beginning",
    detail: `You hold ${money(k.balanceUSDC)}. Make a transfer to start building your on-chain reputation.`,
    tone: "neutral",
    action: { label: "Make a transfer", href: "/transfer" },
  }
}

// ── Top signals ──────────────────────────────────────────────────────────────
// A ranked set of DISTINCT, plain-language readings over the same real data.
// Where buildInsight() surfaces the single most urgent thing for the hero, this
// composes the "three things worth knowing" layer beneath the companion (File 06
// dashboard hierarchy). Every candidate is scored by relevance; the top three
// distinct ones render. Deterministic, pure, nothing fabricated.

export type SignalKind = "flow" | "momentum" | "standing" | "reliability" | "holdings" | "start"

export interface Signal {
  kind: SignalKind
  label: string // short eyebrow, e.g. "Net flow"
  headline: string // the reading, one line
  detail: string // one supporting sentence
  tone: "positive" | "neutral" | "caution"
  weight: number // ranking score — higher shows first
  action?: InsightAction
}

// Build every applicable signal, then return the top `count` by weight. The
// hero's primary insight is passed in so we never repeat it verbatim below.
export function topSignals(k: WalletKundli, txs: ArcTx[], count = 3): Signal[] {
  const flow = flowStats(txs)
  const streak = activeStreak(k.activityByDay)
  const trend = activityTrend(k.activityByDay)
  const busy = busiestDay(k.activityByDay)
  const rate = successRate(txs)
  const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`
  const out: Signal[] = []

  // Net flow over the recent sample.
  if (flow.sampleSize >= 2 && Math.abs(flow.net) >= 0.01) {
    const up = flow.net > 0
    out.push({
      kind: "flow",
      label: "Net flow",
      headline: up ? `+${money(flow.net)} this week` : `−${money(Math.abs(flow.net))} this week`,
      detail: `${money(flow.totalIn)} in, ${money(flow.totalOut)} out across your last ${flow.sampleSize} moves.`,
      tone: up ? "positive" : "neutral",
      weight: 70 + Math.min(20, Math.abs(flow.net) / 5),
      action: { label: "Understand what happened", href: "/analytics" },
    })
  }

  // Momentum — direction of activity over the window.
  if (trend.total > 0) {
    const rising = trend.deltaPct != null && trend.deltaPct > 0
    const falling = trend.deltaPct != null && trend.deltaPct < 0
    out.push({
      kind: "momentum",
      label: "Momentum",
      headline:
        streak >= 3
          ? `${streak}-day streak`
          : rising
            ? `Activity up ${trend.deltaPct}%`
            : falling
              ? `Activity down ${Math.abs(trend.deltaPct as number)}%`
              : `${trend.activeDays} active days`,
      detail:
        busy && busy.count > 0
          ? `Busiest day saw ${busy.count} ${busy.count === 1 ? "move" : "moves"}; ${trend.total} in the last ${trend.window} days.`
          : `${trend.total} moves across the last ${trend.window} days.`,
      tone: streak >= 3 || rising ? "positive" : "neutral",
      weight: 55 + (streak >= 3 ? 15 : 0) + (rising ? 8 : 0),
      action: { label: "View activity", href: "/activity" },
    })
  }

  // Reliability — only worth surfacing when it's imperfect.
  if (flow.sampleSize >= 3 && rate < 100) {
    out.push({
      kind: "reliability",
      label: "Reliability",
      headline: `${rate}% of sends land`,
      detail:
        flow.failed > 0
          ? `${flow.failed} recent ${flow.failed === 1 ? "send" : "sends"} failed — failed sends still cost gas.`
          : "A few recent transactions didn't confirm.",
      tone: rate < 80 ? "caution" : "neutral",
      weight: 60 + (100 - rate),
      action: { label: "Review & retry", href: "/activity" },
    })
  }

  // Standing — rank / percentile context.
  if (k.txCount > 0) {
    out.push({
      kind: "standing",
      label: "Standing",
      headline: `${k.rank} · top ${Math.max(1, 100 - k.percentile)}%`,
      detail: `Ahead of ${k.percentile}% of Arc wallets, on ${k.score} of 1000.`,
      tone: k.score >= 500 ? "positive" : "neutral",
      weight: 45 + k.score / 40,
      action: { label: "See the breakdown", href: "/analytics" },
    })
  }

  // Holdings — always a valid reading; low weight so richer signals win.
  out.push({
    kind: "holdings",
    label: "Holdings",
    headline: money(k.balanceUSDC),
    detail:
      k.balanceUSDC > 0
        ? `Everything you hold on Arc, across ${k.tokenTransfers} token ${k.tokenTransfers === 1 ? "transfer" : "transfers"}.`
        : "Fund from the faucet to make your first move.",
    tone: "neutral",
    weight: k.balanceUSDC > 0 ? 40 : 30,
    action: { label: "Everything you own", href: "/portfolio" },
  })

  // Cold-start fallback so the layer is never empty for a fresh wallet.
  if (out.length < count) {
    out.push({
      kind: "start",
      label: "First step",
      headline: "Make your first move",
      detail: "One transfer starts your ledger — AetherFI reads it back as intelligence.",
      tone: "neutral",
      weight: 10,
      action: { label: "Send USDC", href: "/transfer" },
    })
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, count)
}
