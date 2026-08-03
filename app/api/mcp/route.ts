import { NextRequest, NextResponse } from "next/server"
import { getKundli, ARCSCAN_URL } from "@/lib/arc"

export const runtime = "nodejs"

// AetherFi's MCP server. Speaks the Model Context Protocol over plain HTTP JSON-RPC
// so any AI client (Claude, ChatGPT with an MCP bridge, etc.) can read Arc wallet
// data and get a transaction PREPARED for the human to sign. It never asks for a
// key or a seed phrase and never signs anything itself. Reads are free and safe.

const ADDR = /^0x[a-fA-F0-9]{40}$/
const ARC_CHAIN_ID = 5042002

const TOOLS = [
  {
    name: "get_wallet_kundli",
    description:
      "Get the full Arc Testnet analytics for a wallet: score, rank, balance, tx count, badges and an AI personality read. Read-only and free.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "0x wallet address on Arc Testnet" },
      },
      required: ["address"],
    },
  },
  {
    name: "prepare_transfer",
    description:
      "Prepare an Arc Testnet USDC transfer for the user to review and sign in their own wallet. Returns an unsigned transaction request. It does NOT send anything and cannot move funds on its own.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "recipient 0x address" },
        amount: { type: "string", description: "amount in USDC, e.g. \"1.5\"" },
      },
      required: ["to", "amount"],
    },
  },
]

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result })
}
function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } })
}
function textContent(obj: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] }
}

export async function POST(req: NextRequest) {
  let body: { id?: unknown; method?: string; params?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return err(null, -32700, "Parse error")
  }
  const { id = null, method, params = {} } = body

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "aetherfi", version: "1.0.0" },
    })
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS })
  }

  if (method === "tools/call") {
    const name = params.name as string
    const args = (params.arguments as Record<string, unknown>) ?? {}

    if (name === "get_wallet_kundli") {
      const address = String(args.address ?? "")
      if (!ADDR.test(address)) return ok(id, textContent({ error: "Invalid address" }))
      try {
        const k = await getKundli(address)
        return ok(id, textContent(k))
      } catch {
        return ok(id, textContent({ error: "Could not reach Arc network" }))
      }
    }

    if (name === "prepare_transfer") {
      const to = String(args.to ?? "")
      const amount = String(args.amount ?? "")
      if (!ADDR.test(to)) return ok(id, textContent({ error: "Invalid recipient address" }))
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0)
        return ok(id, textContent({ error: "Invalid amount" }))
      // USDC on Arc has 6 decimals. We return a raw request the user signs.
      const units = BigInt(Math.round(value * 1e6)).toString()
      return ok(
        id,
        textContent({
          note: "Unsigned. Hand this to the user's wallet to review and sign. AetherFI never signs.",
          chainId: ARC_CHAIN_ID,
          request: { to, valueUSDC: amount, amountUnits: units },
          explorer: ARCSCAN_URL,
        })
      )
    }

    return err(id, -32601, `Unknown tool: ${name}`)
  }

  // Notifications (no id) get an empty 200.
  if (id === null || id === undefined) return new NextResponse(null, { status: 204 })

  return err(id, -32601, `Unknown method: ${method}`)
}

export async function GET() {
  return NextResponse.json({
    name: "aetherfi",
    protocol: "mcp",
    transport: "http-jsonrpc",
    tools: TOOLS.map((t) => t.name),
    hint: "POST JSON-RPC here. Reads are free, transfers are prepared for the user to sign.",
  })
}
