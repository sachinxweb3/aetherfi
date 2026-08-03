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
// the sample address). Only appends a query string when the endpoint has params.
export function endpointUrl(origin: string, ep: ApiEndpoint, values: Record<string, string> = {}): string {
  const base = `${normalizeOrigin(origin)}${ep.path}`
  if (ep.params.length === 0) return base
  const qs = ep.params
    .map((p) => `${p.name}=${encodeURIComponent(values[p.name] ?? SAMPLE_ADDRESS)}`)
    .join("&")
  return `${base}?${qs}`
}

// A ready-to-run curl for a GET endpoint.
export function curlFor(origin: string, ep: ApiEndpoint, values: Record<string, string> = {}): string {
  return `curl "${endpointUrl(origin, ep, values)}"`
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
