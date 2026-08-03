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
  /** Icon registry key resolved to a Lucide line icon at render time. */
  icon: string
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

/* ---------- Transaction history (Activity module) ---------- */

// Normalized, render-ready transaction record. Direction is resolved relative
// to the queried wallet. All read-only, from the same free ArcScan v2 endpoint
// that powers the aura — no new dependency, no key.
export interface ArcTx {
  hash: string
  timestamp: string | null
  from: string
  to: string | null
  direction: "in" | "out" | "self"
  valueUSDC: number
  feeUSDC: number
  status: "ok" | "error" | "pending"
  method: string | null
  blockNumber: number | null
}

// Raw Blockscout v2 transaction shape (only the fields we consume).
interface RawTx {
  hash?: string
  timestamp?: string | null
  from?: { hash?: string } | null
  to?: { hash?: string } | null
  value?: string | null
  fee?: { value?: string | null } | null
  status?: string | null
  result?: string | null
  method?: string | null
  block_number?: number | null
}

function directionFor(from: string, to: string | null, self: string): ArcTx["direction"] {
  const f = from.toLowerCase()
  const t = (to ?? "").toLowerCase()
  const s = self.toLowerCase()
  if (f === s && t === s) return "self"
  if (f === s) return "out"
  return "in"
}

function mapTx(raw: RawTx, self: string): ArcTx {
  const from = raw.from?.hash ?? ""
  const to = raw.to?.hash ?? null
  const status: ArcTx["status"] =
    raw.status === "ok" || raw.result === "success"
      ? "ok"
      : raw.status === "error" || (raw.result && raw.result !== "success")
        ? "error"
        : "pending"
  return {
    hash: raw.hash ?? "",
    timestamp: raw.timestamp ?? null,
    from,
    to,
    direction: directionFor(from, to, self),
    valueUSDC: toNum(raw.value) / WEI,
    feeUSDC: toNum(raw.fee?.value) / WEI,
    status,
    method: raw.method ?? null,
    blockNumber: typeof raw.block_number === "number" ? raw.block_number : null,
  }
}

// Recent transactions for a wallet, newest first, normalized for display.
export async function getTransactions(address: string, limit = 25): Promise<ArcTx[]> {
  const addr = address.toLowerCase()
  const data = await j<{ items: RawTx[] }>(
    `${ARCSCAN_API}/addresses/${addr}/transactions?filter=to%20%7C%20from`,
  )
  const items = data?.items ?? []
  return items.slice(0, limit).map((raw) => mapTx(raw, addr))
}

/* ---------- Portfolio (holdings) ---------- */

// A single holding: the native USDC coin, or an ERC-20 token balance.
export interface Holding {
  symbol: string
  name: string
  amount: number
  decimals: number
  isNative: boolean
  contract: string | null
}

export interface Portfolio {
  address: string
  nativeUSDC: number
  holdings: Holding[]
}

interface RawTokenBalance {
  value?: string | null
  token?: {
    name?: string | null
    symbol?: string | null
    decimals?: string | null
    address?: string | null
  } | null
}

function scaleByDecimals(value: string | number | null | undefined, decimals: number): number {
  const raw = toNum(value)
  if (raw === 0) return 0
  return raw / Math.pow(10, decimals)
}

// Wallet holdings: native USDC balance plus any ERC-20 token balances.
// Read-only, from the free ArcScan v2 API — no key, no writes.
export async function getPortfolio(address: string): Promise<Portfolio> {
  const addr = address.toLowerCase()
  const [info, tokens] = await Promise.all([
    j<Record<string, unknown>>(`${ARCSCAN_API}/addresses/${addr}`),
    j<RawTokenBalance[]>(`${ARCSCAN_API}/addresses/${addr}/token-balances`),
  ])

  const nativeUSDC = toNum(info?.coin_balance as string) / WEI

  const holdings: Holding[] = [
    { symbol: "USDC", name: "USD Coin", amount: nativeUSDC, decimals: 18, isNative: true, contract: null },
  ]

  for (const t of tokens ?? []) {
    const decimals = Math.trunc(toNum(t.token?.decimals)) || 18
    const amount = scaleByDecimals(t.value, decimals)
    if (amount <= 0) continue
    holdings.push({
      symbol: t.token?.symbol?.trim() || "TOKEN",
      name: t.token?.name?.trim() || "Unknown token",
      amount,
      decimals,
      isNative: false,
      contract: t.token?.address ?? null,
    })
  }

  return { address: addr, nativeUSDC, holdings }
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

export interface ScoreInput {
  balanceUSDC: number
  txCount: number
  gasUsed: number
  tokenTransfers: number
  walletAgeDays: number
}

// A single weighted factor behind the aura score, normalized 0–1 with the
// points it contributes toward the 0–1000 total. Powers the Analytics
// breakdown — the score is explainable, never a black box (File 06/16).
export interface ScoreFactor {
  key: "tx" | "bal" | "gas" | "tok" | "age"
  label: string
  factor: number // 0..1
  weight: number // share of the 1000-pt total
  points: number // factor * weight * 1000, rounded
}

const SCORE_WEIGHTS = { tx: 0.35, bal: 0.15, gas: 0.15, tok: 0.15, age: 0.2 } as const

// Per-factor breakdown of the aura score. Same math as computeScore, surfaced.
export function scoreBreakdown(i: ScoreInput): ScoreFactor[] {
  const raw = {
    tx: Math.min(1, Math.log10(i.txCount + 1) / 3),
    bal: Math.min(1, Math.log10(i.balanceUSDC + 1) / 5),
    gas: Math.min(1, Math.log10(i.gasUsed + 1) / 8),
    tok: Math.min(1, Math.log10(i.tokenTransfers + 1) / 3),
    age: Math.min(1, i.walletAgeDays / 90),
  }
  const labels = { tx: "Transactions", bal: "Balance", gas: "Gas burned", tok: "Token activity", age: "Wallet age" }
  return (Object.keys(raw) as (keyof typeof raw)[]).map((k) => ({
    key: k,
    label: labels[k],
    factor: raw[k],
    weight: SCORE_WEIGHTS[k],
    points: Math.round(raw[k] * SCORE_WEIGHTS[k] * 1000),
  }))
}

// Weighted score, 0–1000. Logarithmic so whales don't dwarf everyone.
export function computeScore(i: ScoreInput): number {
  const raw = scoreBreakdown(i).reduce((sum, f) => sum + f.factor * f.weight, 0)
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
      icon: "sunrise",
      earned: i.walletAgeDays >= 14,
      hint: "Active on Arc for 2+ weeks",
    },
    {
      id: "active",
      label: "Active Trader",
      icon: "zap",
      earned: i.txCount >= 25,
      hint: "25+ transactions",
    },
    {
      id: "gas",
      label: "Gas Guzzler",
      icon: "flame",
      earned: i.gasUsed >= 1_000_000,
      hint: "Burned 1M+ gas",
    },
    {
      id: "whale",
      label: "USDC Whale",
      icon: "whale",
      earned: i.balanceUSDC >= 1000,
      hint: "1000+ USDC balance",
    },
    {
      id: "tokens",
      label: "Token Mover",
      icon: "target",
      earned: i.tokenTransfers >= 5,
      hint: "5+ token transfers",
    },
    {
      id: "builder",
      label: "Contract Deployer",
      icon: "wrench",
      earned: i.isContract,
      hint: "Deployed a contract",
    },
    {
      id: "faucet",
      label: "Faucet Farmer",
      icon: "droplets",
      earned: i.balanceUSDC > 0 && i.txCount < 5,
      hint: "Has funds, just getting started",
    },
    {
      id: "veteran",
      label: "Arc Veteran",
      icon: "medal",
      earned: i.walletAgeDays >= 60 && i.txCount >= 100,
      hint: "60+ days & 100+ tx",
    },
  ]
}
