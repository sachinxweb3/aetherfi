import { NextResponse } from "next/server"

// The Oracle. You may ask it anything at all, about any subject on earth, but the
// answer stays sealed until you pay a tiny toll on Arc Testnet. You send a real
// transaction, we confirm it landed on-chain, and only then does the answer open.
// Proof of payment is the transaction itself, verified against the Arc RPC. No
// database, no trust, no key required to verify.

export const runtime = "nodejs"

const ARC_RPC = "https://rpc.testnet.arc.network"
const TX_HASH = /^0x[a-fA-F0-9]{64}$/
const ADDR = /^0x[a-fA-F0-9]{40}$/

// A toll must be freshly paid to unlock — reject tolls older than this. The
// sign→mine→answer flow takes seconds; 10 minutes is generous for slow mining or
// a retry, while stopping an old self-transfer hash from being replayed forever.
// Fully stateless (block timestamp vs. server clock), so it holds the no-database
// constraint. It does NOT stop rapid reuse of the same hash within the window —
// that needs server state and is a separate, gated decision.
const MAX_TOLL_AGE_SEC = 600

interface Body {
  question?: string
  txHash?: string
  from?: string
}

export async function POST(req: Request) {
  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const question = (body.question ?? "").slice(0, 500).trim()
  const txHash = (body.txHash ?? "").trim()
  const from = (body.from ?? "").trim()

  if (!question) return NextResponse.json({ error: "Ask a question first." }, { status: 400 })
  if (!TX_HASH.test(txHash))
    return NextResponse.json({ error: "A valid Arc transaction is required to unlock." }, { status: 402 })
  if (!ADDR.test(from))
    return NextResponse.json({ error: "A connected wallet is required to unlock." }, { status: 402 })

  // Verify the toll actually landed on Arc Testnet AND belongs to this asker.
  const verified = await verifyTx(txHash, from)
  if (!verified.ok)
    return NextResponse.json(
      { error: verified.reason ?? "Transaction not confirmed yet. Try again in a moment." },
      { status: 402 }
    )

  const key = process.env.OPENAI_API_KEY
  if (key) {
    const answer = await tryOpenAI(key, question)
    if (answer) return NextResponse.json({ answer, source: "ai", txHash })
  }
  return NextResponse.json({ answer: localAnswer(question), source: "local", txHash })
}

async function verifyTx(hash: string, from: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(ARC_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [hash],
      }),
      // Don't cache — we want the live receipt.
      cache: "no-store",
    })
    if (!res.ok) return { ok: false, reason: "Could not reach Arc RPC to verify." }
    const data = (await res.json()) as {
      result?: { status?: string; from?: string; to?: string; blockNumber?: string } | null
    }
    const receipt = data.result
    if (!receipt) return { ok: false, reason: "Transaction not mined yet. Try again in a moment." }
    if (receipt.status && receipt.status !== "0x1")
      return { ok: false, reason: "That transaction failed on-chain." }

    // Bind the toll to the asker: the sender must be the connected wallet, and the
    // toll is a self-transfer (to === from), matching what the UI actually sends.
    // This stops unlocking with someone else's — or an unrelated — confirmed tx.
    const asker = from.toLowerCase()
    if ((receipt.from ?? "").toLowerCase() !== asker)
      return { ok: false, reason: "That toll was paid by a different wallet. Pay from your connected wallet." }
    if (receipt.to && receipt.to.toLowerCase() !== asker)
      return { ok: false, reason: "The toll must be a self-transfer from your connected wallet." }

    // Recency: the toll must be recent. Reject a stale/replayed hash by comparing
    // its block's timestamp to now. If the block can't be read, fail open on
    // recency only (the binding checks above already passed) so a transient RPC
    // hiccup doesn't wrongly seal a genuine fresh toll.
    if (receipt.blockNumber) {
      const minedAt = await blockTimestamp(receipt.blockNumber)
      if (minedAt !== null) {
        const ageSec = Math.floor(Date.now() / 1000) - minedAt
        if (ageSec > MAX_TOLL_AGE_SEC)
          return {
            ok: false,
            reason: "That toll has expired. Pay a fresh toll to ask again.",
          }
      }
    }

    return { ok: true }
  } catch {
    return { ok: false, reason: "Could not reach Arc RPC to verify." }
  }
}

// Read a block's unix timestamp (seconds) by number, or null if unavailable.
async function blockTimestamp(blockNumber: string): Promise<number | null> {
  try {
    const res = await fetch(ARC_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBlockByNumber",
        params: [blockNumber, false],
      }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as { result?: { timestamp?: string } | null }
    const ts = data.result?.timestamp
    if (!ts) return null
    const n = parseInt(ts, 16)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

async function tryOpenAI(key: string, question: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are the AetherFI Oracle. The user has paid an on-chain toll to ask you anything. Answer any question on any topic clearly and helpfully in 3-6 sentences. Never give financial advice.",
          },
          { role: "user", content: question },
        ],
        max_tokens: 320,
        temperature: 0.7,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

// Free demo answer when no AI key is set. The point of the demo is the on-chain
// gate, so we confirm the toll and hand the user a real place to get the answer.
function localAnswer(question: string): string {
  const q = encodeURIComponent(question)
  return (
    `Toll confirmed on Arc, your question is unlocked.\n\n` +
    `"${question}"\n\n` +
    `This demo runs fully free with no AI key, so here is a live answer source for it: ` +
    `https://duckduckgo.com/?q=${q}\n\n` +
    `Wire an OpenAI key into the deployment and the Oracle answers any question directly, right here.`
  )
}
