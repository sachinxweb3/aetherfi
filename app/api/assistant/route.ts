import { NextResponse } from "next/server"

// AetherFi AI Assistant — answers questions about Arc, the user's wallet, and
// how to use the app. Uses OpenAI if a key is set; otherwise a free rule-based
// helper so it always responds.

export const runtime = "nodejs"

interface Body {
  message?: string
  context?: {
    rank?: string
    score?: number
    txCount?: number
    balanceUSDC?: number
    walletAgeDays?: number
  }
}

const SYSTEM = `You are Aura, the friendly assistant inside AetherFi — an Arc Testnet wallet analytics dashboard.
Facts you know:
- Arc is an EVM Layer-1 for stablecoin finance. Testnet Chain ID 5042002, RPC https://rpc.testnet.arc.network, gas token USDC, explorer https://testnet.arcscan.app.
- Get testnet USDC from https://faucet.circle.com (select Arc Testnet).
- AetherFi shows a wallet's activity score (0-1000), rank, badges, and an AI personality — all free, read-only.
Answer concisely (2-4 sentences). Never give financial advice. If asked for the user's stats, use the provided context.`

export async function POST(req: Request) {
  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const msg = (body.message ?? "").slice(0, 500)
  if (!msg) return NextResponse.json({ error: "Empty message" }, { status: 400 })

  const key = process.env.OPENAI_API_KEY
  if (key) {
    const ai = await tryOpenAI(key, msg, body.context)
    if (ai) return NextResponse.json({ reply: ai, source: "ai" })
  }
  return NextResponse.json({ reply: localReply(msg, body.context), source: "local" })
}

async function tryOpenAI(
  key: string,
  message: string,
  ctx?: Body["context"]
): Promise<string | null> {
  const ctxLine = ctx
    ? `\nUser's wallet: rank ${ctx.rank}, score ${ctx.score}/1000, ${ctx.txCount} tx, ${ctx.balanceUSDC?.toFixed(2)} USDC, ${ctx.walletAgeDays} days old.`
    : ""
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM + ctxLine },
          { role: "user", content: message },
        ],
        max_tokens: 220,
        temperature: 0.6,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

// Free rule-based fallback for common questions.
function localReply(msg: string, ctx?: Body["context"]): string {
  const m = msg.toLowerCase()

  if (/(faucet|test.*usdc|get.*usdc|free.*usdc)/.test(m))
    return "Grab testnet USDC from the Circle faucet: https://faucet.circle.com — select Arc Testnet, paste your address, and funds arrive in under a minute."

  if (/(rpc|chain id|network|add.*arc|connect)/.test(m))
    return "Arc Testnet — Chain ID 5042002, RPC https://rpc.testnet.arc.network, gas token USDC, explorer https://testnet.arcscan.app. AetherFi adds it to your wallet automatically when you connect."

  if (/(score|rank|how.*calculated|percentile)/.test(m))
    return `Your score (0-1000) blends transactions, balance, gas used, token transfers, and wallet age — on a log scale so whales don't dominate.${ctx?.score !== undefined ? ` You're at ${ctx.score}/1000 (${ctx.rank}).` : ""}`

  if (/(badge|achievement|unlock)/.test(m))
    return "Badges unlock from on-chain activity: Early Adopter (2+ weeks), Active Trader (25+ tx), Gas Guzzler (1M+ gas), USDC Whale (1000+ USDC), and more. Just use Arc and they light up."

  if (/(what is arc|about arc|arc\b)/.test(m))
    return "Arc is an EVM-compatible Layer-1 built for stablecoin finance, where USDC is the native gas token. AetherFi reads your Arc Testnet activity to build your on-chain identity."

  if (/(my|stats|score).*(wallet|me)|how am i/.test(m) && ctx)
    return `You're ranked ${ctx.rank} with ${ctx.score}/1000 — ${ctx.txCount} transactions, ${ctx.balanceUSDC?.toFixed(2)} USDC, active for ${ctx.walletAgeDays} days. Keep transacting to climb!`

  return "I'm Aura 🔮 — ask me about Arc Testnet, the faucet, how your score/badges work, or how to climb the leaderboard. (Tip: add an OpenAI key to unlock full AI answers.)"
}
