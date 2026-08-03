import { describe, it, expect } from "vitest"
import { isLocalIntent, resolveTurn } from "../lib/chat"
import type { WalletKundli, ArcTx } from "../lib/arc"

// AI Workspace chat orchestration (File 05, File 16).
const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "in",
  valueUSDC: 0, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})
const kundli = (over: Partial<WalletKundli>): WalletKundli => ({
  address: "0xself", balanceUSDC: 100, txCount: 10, gasUsed: 1000, tokenTransfers: 2,
  walletAgeDays: 30, score: 300, rank: "Explorer", percentile: 50,
  badges: [], activityByDay: Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: 0 })),
  ...over,
})

describe("isLocalIntent", () => {
  it("treats wallet-data questions as local", () => {
    expect(isLocalIntent("what's my balance")).toBe(true)
    expect(isLocalIntent("why is my score that number")).toBe(true)
  })
  it("defers open-ended and help questions", () => {
    expect(isLocalIntent("what is arc")).toBe(false)
    expect(isLocalIntent("help")).toBe(false)
    expect(isLocalIntent("tell me a joke")).toBe(false)
  })
  it("local-intent follow-ups stay local when the prior turn was a wallet intent", () => {
    expect(isLocalIntent("why?", "score")).toBe(true)
    expect(isLocalIntent("and received?", "balance")).toBe(true)
  })
})

describe("resolveTurn", () => {
  it("answers local intents synchronously without calling the API", async () => {
    let called = false
    const fakeFetch = (async () => {
      called = true
      return new Response("{}")
    }) as unknown as typeof fetch
    const turn = await resolveTurn(kundli({ balanceUSDC: 250 }), [], "what's my balance", fakeFetch)
    expect(called).toBe(false)
    expect(turn.source).toBe("local")
    expect(turn.text).toContain("250")
  })

  it("defers open-ended questions to the assistant API", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ reply: "Arc is an L1.", source: "ai" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch
    const turn = await resolveTurn(kundli({}), [], "what is arc", fakeFetch)
    expect(turn.source).toBe("ai")
    expect(turn.text).toBe("Arc is an L1.")
  })

  it("surfaces a confirm-action card for transfer commands, without calling the API", async () => {
    let called = false
    const fakeFetch = (async () => {
      called = true
      return new Response("{}")
    }) as unknown as typeof fetch
    const turn = await resolveTurn(kundli({}), [], "send 5 usdc to 0x1234567890abcdef1234567890abcdef12345678", fakeFetch)
    expect(called).toBe(false)
    expect(turn.command?.kind).toBe("transfer")
    expect(turn.text).toMatch(/Review and sign/)
  })

  it("resolves a named recipient via the saved Address Book and names the card", async () => {
    const ADDR = "0x1234567890abcdef1234567890abcdef12345678"
    const turn = await resolveTurn(
      kundli({}), [],
      `send 5 usdc to Alice`,
      (async () => {
        throw new Error("should not call the API for a resolved command")
      }) as unknown as typeof fetch,
      null,
      [{ id: "c1", label: "Alice", address: ADDR }],
    )
    expect(turn.command?.kind).toBe("transfer")
    if (turn.command?.kind === "transfer") {
      expect(turn.command.to).toBe(ADDR)
      expect(turn.command.label).toContain("Alice")
    }
    expect(turn.text).toContain("Alice")
  })

  it("names an address-form transfer when the recipient is a saved contact", async () => {
    const ADDR = "0x1234567890abcdef1234567890abcdef12345678"
    const turn = await resolveTurn(
      kundli({}), [],
      `send 5 usdc to ${ADDR}`,
      (async () => {
        throw new Error("should not call the API for a resolved command")
      }) as unknown as typeof fetch,
      null,
      [{ id: "c1", label: "Alice", address: ADDR }],
    )
    expect(turn.text).toContain("Alice")
  })

  it("falls back to a local answer when the API fails", async () => {
    const fakeFetch = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch
    const turn = await resolveTurn(kundli({}), [tx({ direction: "out", valueUSDC: 5 })], "what is arc", fakeFetch)
    expect(turn.source).toBe("local")
    expect(turn.text.length).toBeGreaterThan(0)
  })

  it("resolves a follow-up in context and exposes the intent for the next turn", async () => {
    let called = false
    const fakeFetch = (async () => {
      called = true
      return new Response("{}")
    }) as unknown as typeof fetch
    // A bare "why?" would defer to the API alone, but with prior intent "score"
    // it answers locally and carries the intent forward.
    const turn = await resolveTurn(kundli({ score: 300 }), [], "why?", fakeFetch, "score")
    expect(called).toBe(false)
    expect(turn.source).toBe("local")
    expect(turn.intent).toBe("score")
    expect(turn.text).toContain("300/1000")
  })
})
