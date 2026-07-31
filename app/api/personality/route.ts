import { NextResponse } from "next/server"

// AI Wallet Personality. Uses OpenAI if OPENAI_API_KEY is set, otherwise
// falls back to a free, deterministic local generator so the app always works.

export const runtime = "nodejs"

interface Stats {
  address?: string
  balanceUSDC?: number
  txCount?: number
  gasUsed?: number
  tokenTransfers?: number
  walletAgeDays?: number
  rank?: string
  score?: number
}

export async function POST(req: Request) {
  let stats: Stats = {}
  try {
    stats = (await req.json()) as Stats
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const key = process.env.OPENAI_API_KEY
  if (key) {
    const ai = await tryOpenAI(key, stats)
    if (ai) return NextResponse.json({ personality: ai, source: "ai" })
  }

  return NextResponse.json({ personality: localPersonality(stats), source: "local" })
}

async function tryOpenAI(key: string, s: Stats): Promise<string | null> {
  const prompt = `You are a witty crypto analyst. Based on this Arc Testnet wallet's on-chain stats, write a short, funny but insightful "wallet personality" roast (max 3 sentences, playful, no financial advice).
Stats:
- Rank: ${s.rank} (score ${s.score}/1000)
- Balance: ${fmt(s.balanceUSDC)} USDC
- Transactions: ${s.txCount}
- Gas used: ${s.gasUsed}
- Token transfers: ${s.tokenTransfers}
- Wallet age: ${s.walletAgeDays} days`

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 160,
        temperature: 0.9,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function fmt(n?: number): string {
  if (!n) return "0"
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toFixed(2)
}

// Free fallback — deterministic, no external calls.
function localPersonality(s: Stats): string {
  const tx = s.txCount ?? 0
  const bal = s.balanceUSDC ?? 0
  const age = s.walletAgeDays ?? 0
  const gas = s.gasUsed ?? 0

  const traits: string[] = []
  if (bal > 0 && tx < 5) traits.push("You farmed the faucet and then went quiet — classic hoarder energy 💧")
  else if (tx >= 50) traits.push("You treat Arc like a playground, spamming transactions like there's no gas tomorrow ⚡")
  else if (tx >= 10) traits.push("A steady hand — you experiment carefully and actually read the docs 🧠")
  else traits.push("Fresh off the boat, still finding your feet on Arc 🌱")

  if (gas >= 1_000_000) traits.push("Your gas meter is on fire 🔥")
  if (bal >= 1000) traits.push("The whales fear you 🐋")
  if (age >= 30) traits.push(`Loyal too — ${age} days deep and still here 🎖️`)

  const verdict =
    (s.score ?? 0) >= 600
      ? "Verdict: certified Arc degen, and the chain is better for it."
      : (s.score ?? 0) >= 300
        ? "Verdict: solid contributor with room to go legendary."
        : "Verdict: potential detected — go make some noise onchain."

  return `${traits.join(" ")} ${verdict}`
}
