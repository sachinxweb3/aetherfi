// Developer surface catalog — the single, honest source of truth for AETHER's
// public API and MCP integration (File 08 developer/plugin surface, File 16
// honesty). Pure + testable: every endpoint, tool, and snippet here mirrors what
// the server at /api/* actually implements. No fabricated endpoints, no keys.

export const ARC_CHAIN_ID = 5042002

// A sample address used in copy-paste examples when no wallet is connected.
export const SAMPLE_ADDRESS = "0x0000000000000000000000000000000000000000"

export interface ApiParam {
  name: string
  required: boolean
  detail: string
}

export interface ApiEndpoint {
  id: string
  method: "GET" | "POST"
  path: string
  title: string
  detail: string
  params: ApiParam[]
  /** For POST endpoints: a real JSON request-body example. */
  body?: Record<string, string | number | boolean | null>
}

// Read-only HTTP endpoints AETHER exposes. These all exist under app/api/*.
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "kundli",
    method: "GET",
    path: "/api/kundli",
    title: "Wallet analytics",
    detail: "Full Arc analytics for a wallet: score, rank, balance, tx count, badges, and activity.",
    params: [{ name: "address", required: true, detail: "0x wallet address on Arc Testnet" }],
  },
  {
    id: "activity",
    method: "GET",
    path: "/api/activity",
    title: "Transaction history",
    detail: "Recent normalized transactions for a wallet — direction, value, fee, and status.",
    params: [{ name: "address", required: true, detail: "0x wallet address on Arc Testnet" }],
  },
  {
    id: "portfolio",
    method: "GET",
    path: "/api/portfolio",
    title: "Holdings",
    detail: "Native USDC balance plus any ERC-20 token holdings for a wallet.",
    params: [{ name: "address", required: true, detail: "0x wallet address on Arc Testnet" }],
  },
  {
    id: "leaderboard",
    method: "GET",
    path: "/api/leaderboard",
    title: "Leaderboard",
    detail: "Ranked wallets by aura score — the shared Arc reputation board.",
    params: [],
  },
  {
    id: "assistant",
    method: "POST",
    path: "/api/assistant",
    title: "AI assistant",
    detail: "Ask Aura about Arc, a wallet, or how to use the app. Uses OpenAI when configured, otherwise a free rule-based reply — it always responds.",
    params: [{ name: "message", required: true, detail: "your question (max 500 chars)" }],
    body: { message: "How do I get testnet USDC on Arc?" },
  },
  {
    id: "personality",
    method: "POST",
    path: "/api/personality",
    title: "Wallet personality",
    detail: "A short, playful personality read from a wallet's on-chain stats. Uses OpenAI when configured, otherwise a deterministic local generator.",
    params: [
      { name: "rank", required: false, detail: "wallet rank label" },
      { name: "score", required: false, detail: "activity score 0–1000" },
      { name: "balanceUSDC", required: false, detail: "native USDC balance" },
      { name: "txCount", required: false, detail: "transaction count" },
    ],
    body: { rank: "Arc Veteran", score: 720, balanceUSDC: 12.5, txCount: 84 },
  },
  {
    id: "oracle",
    method: "POST",
    path: "/api/oracle",
    title: "The Oracle",
    detail: "Ask anything; the answer unlocks only after a real Arc toll transaction is verified on-chain. Stateless proof-of-payment — no key needed to verify.",
    params: [
      { name: "question", required: true, detail: "your question (max 500 chars)" },
      { name: "txHash", required: true, detail: "0x hash of the toll transaction on Arc Testnet" },
      { name: "from", required: true, detail: "0x wallet address that paid the toll" },
    ],
    body: { question: "What is the meaning of the chain?", txHash: "0x" + "0".repeat(64), from: SAMPLE_ADDRESS },
  },
]

export interface McpTool {
  name: string
  detail: string
  params: ApiParam[]
  writes: boolean // true if it prepares (never sends) a transaction
}

// MCP tools — must mirror the TOOLS array in app/api/mcp/route.ts exactly.
export const MCP_TOOLS: McpTool[] = [
  {
    name: "get_wallet_kundli",
    detail: "Read full Arc analytics for a wallet: score, rank, balance, badges, personality. Free and read-only.",
    writes: false,
    params: [{ name: "address", required: true, detail: "0x wallet address on Arc Testnet" }],
  },
  {
    name: "prepare_transfer",
    detail: "Prepare an unsigned Arc USDC transfer for the user to review and sign. Never sends, never signs.",
    writes: true,
    params: [
      { name: "to", required: true, detail: "recipient 0x address" },
      { name: "amount", required: true, detail: 'amount in USDC, e.g. "1.5"' },
    ],
  },
]

// Normalize an origin (strip a trailing slash) so snippets never double up.
export function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "")
}

// Full URL for an endpoint, filling required params from `values` (falls back to
// the sample address). Only appends a query string when the endpoint has GET
// query params. POST endpoints carry their params in the JSON body, so the URL
// is just the path.
export function endpointUrl(origin: string, ep: ApiEndpoint, values: Record<string, string> = {}): string {
  const base = `${normalizeOrigin(origin)}${ep.path}`
  if (ep.method !== "GET" || ep.params.length === 0) return base
  const qs = ep.params
    .map((p) => `${p.name}=${encodeURIComponent(values[p.name] ?? SAMPLE_ADDRESS)}`)
    .join("&")
  return `${base}?${qs}`
}

// The JSON body a POST endpoint expects, with any provided `values` overriding
// the example (e.g. the connected address). Returns the endpoint's real example
// body — never a fabricated shape. Empty for GET endpoints.
export function endpointBody(ep: ApiEndpoint, values: Record<string, string> = {}): Record<string, string | number | boolean | null> {
  if (ep.method !== "POST" || !ep.body) return {}
  const merged: Record<string, string | number | boolean | null> = { ...ep.body }
  for (const p of ep.params) {
    if (p.name in values) merged[p.name] = values[p.name]
  }
  return merged
}

// A ready-to-run curl. GET endpoints get a plain curl; POST endpoints get the
// method, JSON content-type header, and the example request body.
export function curlFor(origin: string, ep: ApiEndpoint, values: Record<string, string> = {}): string {
  const url = endpointUrl(origin, ep, values)
  if (ep.method === "GET") return `curl "${url}"`
  const body = JSON.stringify(endpointBody(ep, values))
  return `curl -X POST "${url}" \\\n  -H "content-type: application/json" \\\n  -d '${body}'`
}

// The MCP client config block users paste into Claude / another MCP client.
export function mcpConfig(origin: string): string {
  const url = `${normalizeOrigin(origin)}/api/mcp`
  return `{
  "mcpServers": {
    "aetherfi": {
      "url": "${url}"
    }
  }
}`
}

// A JSON-RPC tools/call example against the MCP endpoint.
export function mcpCurl(origin: string, address: string = SAMPLE_ADDRESS): string {
  const url = `${normalizeOrigin(origin)}/api/mcp`
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "get_wallet_kundli", arguments: { address } },
  })
  return `curl -X POST "${url}" \\\n  -H "content-type: application/json" \\\n  -d '${body}'`
}
