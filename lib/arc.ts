// Arc Testnet on-chain data layer — powered by the free ArcScan (Blockscout) API.
// No API key required. All read-only.

export const ARCSCAN_API = "https://testnet.arcscan.app/api/v2"
export const ARCSCAN_URL = "https://testnet.arcscan.app"

export interface WalletKundli {
  address: string
  balanceUSDC: number
  txCount: number
  gasUsed: number
  tokenTransfers: number
  firstTxDate: string | null
  lastTxDate: string | null
  walletAgeDays: number
  isContract: boolean
  score: number
  rank: string
  percentile: number
  badges: Badge[]
  activityByDay: { date: string; count: number }[]
}

export interface Badge {
  id: string
  label: string
  emoji: string
  earned: boolean
  hint: string
}

const WEI = 1e18

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === "number" ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

async function j<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getKundli(address: string): Promise<WalletKundli> {
  const addr = address.toLowerCase()

  const [info, counters, txs] = await Promise.all([
    j<Record<string, unknown>>(`${ARCSCAN_API}/addresses/${addr}`),
    j<Record<string, string>>(`${ARCSCAN_API}/addresses/${addr}/counters`),
    j<{ items: TxItem[] }>(`${ARCSCAN_API}/addresses/${addr}/transactions?filter=to%20%7C%20from`),
  ])

  const balanceUSDC = toNum(info?.coin_balance as string) / WEI
  const isContract = Boolean(info?.is_contract)
  const txCount = toNum(counters?.transactions_count)
  const gasUsed = toNum(counters?.gas_usage_count)
  const tokenTransfers = toNum(counters?.token_transfers_count)

  const items = txs?.items ?? []
  const timestamps = items
    .map((t) => t.timestamp)
    .filter(Boolean)
    .map((t) => new Date(t as string).getTime())
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)

  const firstTs = timestamps[0] ?? null
  const lastTs = timestamps[timestamps.length - 1] ?? null
  const walletAgeDays = firstTs ? Math.max(0, Math.floor((Date.now() - firstTs) / 86400000)) : 0

  // Activity by day (last 14 days) from recent tx sample
  const activityByDay = buildActivity(timestamps)

  const score = computeScore({ balanceUSDC, txCount, gasUsed, tokenTransfers, walletAgeDays })
  const { rank, percentile } = rankFor(score)
  const badges = computeBadges({
    balanceUSDC,
    txCount,
    gasUsed,
    tokenTransfers,
    walletAgeDays,
    isContract,
    hasTokens: Boolean(info?.has_token_transfers),
  })

  return {
    address: addr,
    balanceUSDC,
    txCount,
    gasUsed,
    tokenTransfers,
    firstTxDate: firstTs ? new Date(firstTs).toISOString() : null,
    lastTxDate: lastTs ? new Date(lastTs).toISOString() : null,
    walletAgeDays,
    isContract,
    score,
    rank,
    percentile,
    badges,
    activityByDay,
  }
}

interface TxItem {
  timestamp?: string
}

function buildActivity(timestamps: number[]): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = []
  const map = new Map<string, number>()
  for (const ts of timestamps) {
    const d = new Date(ts).toISOString().slice(0, 10)
    map.set(d, (map.get(d) ?? 0) + 1)
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    days.push({ date: d, count: map.get(d) ?? 0 })
  }
  return days
}

interface ScoreInput {
  balanceUSDC: number
  txCount: number
  gasUsed: number
  tokenTransfers: number
  walletAgeDays: number
}

// Weighted score, 0–1000. Logarithmic so whales don't dwarf everyone.
export function computeScore(i: ScoreInput): number {
  const tx = Math.min(1, Math.log10(i.txCount + 1) / 3) // ~1000 tx -> max
  const bal = Math.min(1, Math.log10(i.balanceUSDC + 1) / 5)
  const gas = Math.min(1, Math.log10(i.gasUsed + 1) / 8)
  const tok = Math.min(1, Math.log10(i.tokenTransfers + 1) / 3)
  const age = Math.min(1, i.walletAgeDays / 90)
  const raw = tx * 0.35 + bal * 0.15 + gas * 0.15 + tok * 0.15 + age * 0.2
  return Math.round(raw * 1000)
}

export function rankFor(score: number): { rank: string; percentile: number } {
  if (score >= 800) return { rank: "Arc Legend", percentile: 99 }
  if (score >= 600) return { rank: "Arc Pioneer", percentile: 90 }
  if (score >= 400) return { rank: "Active Builder", percentile: 75 }
  if (score >= 200) return { rank: "Explorer", percentile: 50 }
  if (score >= 50) return { rank: "Newcomer", percentile: 25 }
  return { rank: "Fresh Wallet", percentile: 5 }
}

interface BadgeInput extends ScoreInput {
  isContract: boolean
  hasTokens: boolean
}

export function computeBadges(i: BadgeInput): Badge[] {
  return [
    {
      id: "early",
      label: "Early Adopter",
      emoji: "🌅",
      earned: i.walletAgeDays >= 14,
      hint: "Active on Arc for 2+ weeks",
    },
    {
      id: "active",
      label: "Active Trader",
      emoji: "⚡",
      earned: i.txCount >= 25,
      hint: "25+ transactions",
    },
    {
      id: "gas",
      label: "Gas Guzzler",
      emoji: "🔥",
      earned: i.gasUsed >= 1_000_000,
      hint: "Burned 1M+ gas",
    },
    {
      id: "whale",
      label: "USDC Whale",
      emoji: "🐋",
      earned: i.balanceUSDC >= 1000,
      hint: "1000+ USDC balance",
    },
    {
      id: "tokens",
      label: "Token Mover",
      emoji: "🎯",
      earned: i.tokenTransfers >= 5,
      hint: "5+ token transfers",
    },
    {
      id: "builder",
      label: "Contract Deployer",
      emoji: "🛠️",
      earned: i.isContract,
      hint: "Deployed a contract",
    },
    {
      id: "faucet",
      label: "Faucet Farmer",
      emoji: "💧",
      earned: i.balanceUSDC > 0 && i.txCount < 5,
      hint: "Has funds, just getting started",
    },
    {
      id: "veteran",
      label: "Arc Veteran",
      emoji: "🎖️",
      earned: i.walletAgeDays >= 60 && i.txCount >= 100,
      hint: "60+ days & 100+ tx",
    },
  ]
}
