import type { WalletKundli, ArcTx } from "@/lib/arc"
import { scoreBreakdown } from "@/lib/arc"
import { flowStats, activeStreak, busiestDay, activityTrend } from "@/lib/analytics"

// "Ask AETHER" — a deterministic natural-language answer engine over the
// wallet data ALREADY fetched for the dashboard (kundli + recent tx). Pure,
// synchronous, no network, no paid model, nothing fabricated (File 06
// intelligence, File 16 honesty). Real math, plain-English answers.

export type AskIntent =
  | "balance" | "spent" | "received" | "net" | "counterparty"
  | "score" | "rank" | "streak" | "activity" | "failed" | "help" | "unknown"

export interface AskAnswer {
  intent: AskIntent
  text: string
  href?: string // optional deep-link to the relevant surface
}

const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC`
const short = (a: string) => (a && a.length > 16 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a || "—")

// Classify a free-text question into one intent. Order matters: the most
// specific patterns are tested first.
export function classify(question: string): AskIntent {
  const q = question.toLowerCase().trim()
  if (!q) return "unknown"
  if (/\b(help|what can|how do i ask|examples?)\b/.test(q)) return "help"
  if (/\b(fail|failed|error|revert)/.test(q)) return "failed"
  if (/\b(counterpart|top address|recipient)|who (did|do) i|(send|sent|transfer).*most|most.*(send|sent|interact)/.test(q)) return "counterparty"
  if (/\b(streak|consecutive|days? in a row)/.test(q)) return "streak"
  if (/\b(net|net flow|profit|difference)/.test(q)) return "net"
  if (/\b(spent|spend|sent|outgoing|out\b|paid)/.test(q)) return "spent"
  if (/\b(received|receive|incoming|got|earned|in\b)/.test(q)) return "received"
  if (/\b(balance|hold|have|worth|holdings?)/.test(q)) return "balance"
  if (/\b(score|aura|why.*score|points?)/.test(q)) return "score"
  if (/\b(rank|percentile|tier|level|standing)/.test(q)) return "rank"
  if (/\b(activity|active|busiest|trend|transactions?|how many tx)/.test(q)) return "activity"
  return "unknown"
}

// Detect a short follow-up that leans on the previous turn for its subject —
// e.g. "and received?", "what about that?", "why?", "how come". These have no
// standalone intent, so we inherit the prior turn's (see classifyInContext).
export function isFollowUp(question: string): boolean {
  const q = question.toLowerCase().trim()
  if (!q) return false
  // Opens with a connective ("and/but/what about/how about/vs/or").
  if (/^(and|but|what about|how about|vs\.?|versus|or)\b/.test(q)) return true
  // A bare "why/how come/really/same" style follow-up with no data noun.
  if (/^(why|why though|how come|really|and\?|same|then\??)\b/.test(q) && q.length <= 24) return true
  return false
}

// Classify with conversational context: a genuine follow-up inherits the prior
// intent UNLESS the follow-up itself names a new, concrete intent. So "and
// received?" after a balance question becomes "received", while a bare "why?"
// after a score question stays "score". Pure — the caller threads prevIntent.
export function classifyInContext(question: string, prevIntent: AskIntent | null): AskIntent {
  const direct = classify(question)
  if (direct !== "unknown") return direct
  if (prevIntent && prevIntent !== "unknown" && prevIntent !== "help" && isFollowUp(question)) {
    return prevIntent
  }
  return direct
}

// Find the address the wallet has sent to most often (by count) in the sample.
function topCounterparty(txs: ArcTx[], self: string): { addr: string; count: number } | null {
  const counts = new Map<string, number>()
  for (const t of txs) {
    if (t.direction !== "out" || !t.to) continue
    if (t.to.toLowerCase() === self.toLowerCase()) continue
    counts.set(t.to, (counts.get(t.to) ?? 0) + 1)
  }
  let best: { addr: string; count: number } | null = null
  for (const [addr, count] of counts) {
    if (!best || count > best.count) best = { addr, count }
  }
  return best
}

// Answer a question deterministically over the wallet's real data. An optional
// prevIntent lets short follow-ups ("and received?", "why?") inherit the prior
// turn's subject so multi-turn conversations resolve (File 05/06).
export function askAether(
  k: WalletKundli,
  txs: ArcTx[],
  question: string,
  prevIntent: AskIntent | null = null
): AskAnswer {
  const intent = classifyInContext(question, prevIntent)
  const flow = flowStats(txs)

  switch (intent) {
    case "balance":
      return { intent, text: `You currently hold ${money(k.balanceUSDC)} on Arc.`, href: "/portfolio" }

    case "spent":
      return {
        intent,
        text: `You've sent ${money(flow.totalOut)} across ${flow.outCount} outgoing ${flow.outCount === 1 ? "transaction" : "transactions"} in your recent activity${flow.gasSpent > 0 ? `, plus ${money(flow.gasSpent)} in gas` : ""}.`,
        href: "/analytics",
      }

    case "received":
      return {
        intent,
        text: `You've received ${money(flow.totalIn)} across ${flow.inCount} incoming ${flow.inCount === 1 ? "transaction" : "transactions"} in your recent activity.`,
        href: "/analytics",
      }

    case "net": {
      const up = flow.net >= 0
      return {
        intent,
        text: `Your recent net flow is ${up ? "+" : "−"}${money(Math.abs(flow.net))} — received ${money(flow.totalIn)}, sent ${money(flow.totalOut)} over your last ${flow.sampleSize} ${flow.sampleSize === 1 ? "transaction" : "transactions"}.`,
        href: "/analytics",
      }
    }

    case "counterparty": {
      const top = topCounterparty(txs, k.address)
      return top
        ? { intent, text: `Your most frequent recipient is ${short(top.addr)} — ${top.count} ${top.count === 1 ? "transfer" : "transfers"} in your recent activity.`, href: "/activity" }
        : { intent, text: "You have no outgoing transfers in your recent activity yet.", href: "/transfer" }
    }

    case "score": {
      const factors = scoreBreakdown({
        balanceUSDC: k.balanceUSDC, txCount: k.txCount, gasUsed: k.gasUsed,
        tokenTransfers: k.tokenTransfers, walletAgeDays: k.walletAgeDays,
      })
      const top = factors.reduce((b, f) => (f.points > b.points ? f : b), factors[0])
      return {
        intent,
        text: `Your aura score is ${k.score}/1000 (${k.rank}). Your biggest contributor is ${top.label} at ${top.points} points. More activity lifts it.`,
        href: "/analytics",
      }
    }

    case "rank":
      return { intent, text: `You rank as ${k.rank}, ahead of ${k.percentile}% of Arc wallets (score ${k.score}/1000).`, href: "/analytics" }

    case "streak": {
      const streak = activeStreak(k.activityByDay)
      const busy = busiestDay(k.activityByDay)
      return {
        intent,
        text: streak > 0
          ? `You're on a ${streak}-day activity streak.${busy && busy.count > 0 ? ` Your busiest recent day saw ${busy.count} transactions.` : ""}`
          : "You have no active streak right now — make a transfer today to start one.",
        href: "/analytics",
      }
    }

    case "activity": {
      const t = activityTrend(k.activityByDay)
      return {
        intent,
        text: `You've made ${t.total} ${t.total === 1 ? "transaction" : "transactions"} across ${t.activeDays} of the last ${t.window} days${t.deltaPct != null ? `, ${t.deltaPct >= 0 ? "up" : "down"} ${Math.abs(t.deltaPct)}% vs the prior period` : ""}. Lifetime total: ${k.txCount}.`,
        href: "/analytics",
      }
    }

    case "failed":
      return {
        intent,
        text: flow.failed > 0
          ? `${flow.failed} of your recent ${flow.sampleSize} transactions failed. Failed sends still cost gas — check balance and gas before retrying.`
          : "None of your recent transactions failed. All clear.",
        href: "/activity",
      }

    case "help":
      return {
        intent,
        text: "Ask me things like: “What's my balance?”, “How much have I spent?”, “Why is my score that number?”, “Who do I send to most?”, or “What's my streak?”",
      }

    default:
      return {
        intent: "unknown",
        text: "I can answer questions about your balance, spending, income, net flow, score, rank, streak, activity, and failed transactions. Try “how much have I spent?”",
      }
  }
}
