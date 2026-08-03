import { describe, it, expect } from "vitest"
import {
  API_ENDPOINTS, MCP_TOOLS, SAMPLE_ADDRESS,
  normalizeOrigin, endpointUrl, curlFor, mcpConfig, mcpCurl,
} from "../lib/developer"

// The developer catalog is the honest source of truth for AETHER's public API +
// MCP surface (File 08, File 16). These guard that snippets are well-formed and
// that we never advertise a tool the MCP server doesn't implement.

const ORIGIN = "https://aetherfi.example"

describe("normalizeOrigin", () => {
  it("strips trailing slashes so URLs never double up", () => {
    expect(normalizeOrigin("https://x.dev/")).toBe("https://x.dev")
    expect(normalizeOrigin("https://x.dev///")).toBe("https://x.dev")
    expect(normalizeOrigin("https://x.dev")).toBe("https://x.dev")
  })
})

describe("endpointUrl", () => {
  it("appends required params, using the sample address by default", () => {
    const kundli = API_ENDPOINTS.find((e) => e.id === "kundli")!
    expect(endpointUrl(ORIGIN, kundli)).toBe(`${ORIGIN}/api/kundli?address=${SAMPLE_ADDRESS}`)
  })

  it("fills a provided param value", () => {
    const kundli = API_ENDPOINTS.find((e) => e.id === "kundli")!
    const url = endpointUrl(ORIGIN, kundli, { address: "0xabc" })
    expect(url).toBe(`${ORIGIN}/api/kundli?address=0xabc`)
  })

  it("omits the query string for param-less endpoints", () => {
    const lb = API_ENDPOINTS.find((e) => e.id === "leaderboard")!
    expect(endpointUrl(ORIGIN, lb)).toBe(`${ORIGIN}/api/leaderboard`)
  })

  it("tolerates an origin with a trailing slash", () => {
    const kundli = API_ENDPOINTS.find((e) => e.id === "kundli")!
    expect(endpointUrl("https://x.dev/", kundli, { address: "0x1" })).toBe("https://x.dev/api/kundli?address=0x1")
  })
})

describe("curlFor", () => {
  it("wraps the endpoint URL in a runnable curl", () => {
    const activity = API_ENDPOINTS.find((e) => e.id === "activity")!
    expect(curlFor(ORIGIN, activity, { address: "0x1" })).toBe(`curl "${ORIGIN}/api/activity?address=0x1"`)
  })
})

describe("mcpConfig", () => {
  it("points the MCP client at /api/mcp", () => {
    const cfg = mcpConfig(ORIGIN)
    expect(cfg).toContain(`"url": "${ORIGIN}/api/mcp"`)
    expect(cfg).toContain(`"aetherfi"`)
    // Must be valid JSON.
    expect(() => JSON.parse(cfg)).not.toThrow()
  })
})

describe("mcpCurl", () => {
  it("builds a valid JSON-RPC tools/call body", () => {
    const snippet = mcpCurl(ORIGIN, "0x1")
    const match = snippet.match(/-d '(\{.*\})'/s)
    expect(match).not.toBeNull()
    const parsed = JSON.parse(match![1])
    expect(parsed.method).toBe("tools/call")
    expect(parsed.params.name).toBe("get_wallet_kundli")
    expect(parsed.params.arguments.address).toBe("0x1")
  })
})

describe("catalog integrity", () => {
  it("only advertises the two tools the MCP server implements", () => {
    expect(MCP_TOOLS.map((t) => t.name).sort()).toEqual(["get_wallet_kundli", "prepare_transfer"])
  })

  it("flags prepare_transfer as the only write-preparing tool", () => {
    expect(MCP_TOOLS.filter((t) => t.writes).map((t) => t.name)).toEqual(["prepare_transfer"])
  })

  it("every API endpoint has a real /api path and required-param metadata", () => {
    for (const ep of API_ENDPOINTS) {
      expect(ep.path.startsWith("/api/")).toBe(true)
      for (const p of ep.params) expect(typeof p.required).toBe("boolean")
    }
  })
})
