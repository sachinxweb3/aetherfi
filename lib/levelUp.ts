import { scoreBreakdown, rankFor, type ScoreInput } from "@/lib/arc"

// "Level up your aura" — a deterministic recommendation engine over the SAME
// score math the dashboard shows (File 06 intelligence, File 16 honesty). It
// never fabricates a projection: each suggestion's point gain is computed by
// re-running the real scoreBreakdown() on a nudged input, so what we promise is
// exactly what the wallet would earn. Pure + synchronous, no network.

export interface LevelUpTip {
  key: string // factor id (e.g. "txCount") — React key + discriminator
  label: string // short action title
  detail: string // plain-English what-to-do
  gain: number // real projected point gain (>= 0)
  href: string // where to act
}

export interface LevelUpPlan {
  score: number
  toNextRank: number // points to the next rank threshold, 0 if already top
  nextRank: string | null // name of the next rank, null if top
  tips: LevelUpTip[] // highest-gain first, headroom-bearing factors only
}

// Rank thresholds mirror rankFor() in lib/arc.ts. Kept here so we can name the
// NEXT tier and the gap to it without duplicating the score formula itself.
const RANK_STEPS: { min: number; rank: string }[] = [
  { min: 50, rank: "Newcomer" },
  { min: 200, rank: "Explorer" },
  { min: 400, rank: "Active Builder" },
  { min: 600, rank: "Arc Pioneer" },
  { min: 800, rank: "Arc Legend" },
]

// Points to the next rank up, and its name (null/0 when already at the top).
export function nextRankGap(score: number): { toNextRank: number; nextRank: string | null } {
  const next = RANK_STEPS.find((s) => s.min > score)
  return next ? { toNextRank: next.min - score, nextRank: next.rank } : { toNextRank: 0, nextRank: null }
}

// Total score for an input, via the real weighted breakdown (no duplication).
function scoreOf(input: ScoreInput): number {
  return scoreBreakdown(input).reduce((sum, f) => sum + f.points, 0)
}

// A realistic near-term nudge per factor, and how to describe/act on it. These
// are modest, achievable targets — not a fantasy of instant maxing.
function nudge(input: ScoreInput): { key: keyof ScoreInput; label: string; detail: string; href: string; next: ScoreInput }[] {
  return [
    {
      key: "txCount",
      label: "Make a few more transactions",
      detail: "Send or receive on Arc — 5 more transactions lifts your activity factor.",
      href: "/transfer",
      next: { ...input, txCount: input.txCount + 5 },
    },
    {
      key: "tokenTransfers",
      label: "Move some tokens",
      detail: "Do a few token transfers — this factor rewards on-chain token activity.",
      href: "/transfer",
      next: { ...input, tokenTransfers: input.tokenTransfers + 3 },
    },
    {
      key: "balanceUSDC",
      label: "Top up your balance",
      detail: "Hold more USDC on Arc — grab testnet funds from the faucet to raise your balance factor.",
      href: "/portfolio",
      next: { ...input, balanceUSDC: input.balanceUSDC + Math.max(50, input.balanceUSDC) },
    },
    {
      key: "walletAgeDays",
      label: "Keep your wallet active",
      detail: "Wallet age climbs on its own — staying active over the next week keeps this factor rising toward 90 days.",
      href: "/activity",
      next: { ...input, walletAgeDays: Math.min(90, input.walletAgeDays + 7) },
    },
  ]
}

// Build a ranked, honest level-up plan. Only factors with real headroom (a
// positive projected gain) are returned, highest gain first.
export function levelUpPlan(input: ScoreInput): LevelUpPlan {
  const score = scoreOf(input)
  const base = score
  const { toNextRank, nextRank } = nextRankGap(score)

  const tips: LevelUpTip[] = nudge(input)
    .map((n) => ({
      key: n.key,
      label: n.label,
      detail: n.detail,
      href: n.href,
      gain: Math.max(0, scoreOf(n.next) - base),
    }))
    .filter((t) => t.gain > 0)
    .sort((a, b) => b.gain - a.gain)

  return { score, toNextRank, nextRank, tips }
}

// Guard: the rank a score maps to (re-exported convenience for the view).
export function rankName(score: number): string {
  return rankFor(score).rank
}
