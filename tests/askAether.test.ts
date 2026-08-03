import { describe, it, expect } from "vitest"
import { askAether, classify, classifyInContext, isFollowUp } from "../lib/askAether"
import type { WalletKundli, ArcTx } from "../lib/arc"

// Deterministic NL answer engine over live wallet data (File 06, File 12).
const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "in",
  valueUSDC: 0, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})

const kundli = (over: Partial<WalletKundli>): WalletKundli => ({
  address: "0xself", balanceUSDC: 250, txCount: 42, gasUsed: 500000, tokenTransfers: 5,
  walletAgeDays: 60, score: 350, rank: "Explorer", percentile: 55,
  badges: [], activityByDay: Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: i >= 12 ? 2 : 0 })),
  ...over,
})

describe("classify", () => {
  it("maps common phrasings to intents", () => {
    expect(classify("what's my balance?")).toBe("balance")
    expect(classify("how much have I spent")).toBe("spent")
    expect(classify("how much did I receive")).toBe("received")
    expect(classify("what's my net flow")).toBe("net")
    expect(classify("who do I send to most")).toBe("counterparty")
    expect(classify("why is my score that number")).toBe("score")
    expect(classify("what's my rank")).toBe("rank")
    expect(classify("what's my streak")).toBe("streak")
    expect(classify("any failed transactions?")).toBe("failed")
    expect(classify("help")).toBe("help")
    expect(classify("askjdhrandomgibberish")).toBe("unknown")
  })
})

describe("askAether", () => {
  const txs = [
    tx({ direction: "in", valueUSDC: 100 }),
    tx({ direction: "out", valueUSDC: 40, feeUSDC: 0.01, to: "0xrecipient1" }),
    tx({ direction: "out", valueUSDC: 10, feeUSDC: 0.01, to: "0xrecipient1" }),
    tx({ direction: "out", valueUSDC: 5, status: "error", to: "0xrecipient2" }),
  ]

  it("answers balance from real data", () => {
    const a = askAether(kundli({ balanceUSDC: 250 }), txs, "what's my balance?")
    expect(a.intent).toBe("balance")
    expect(a.text).toContain("250")
    expect(a.href).toBe("/portfolio")
  })

  it("computes spending and income", () => {
    expect(askAether(kundli({}), txs, "how much have I spent").text).toContain("55 USDC")
    expect(askAether(kundli({}), txs, "how much did I receive").text).toContain("100 USDC")
  })

  it("identifies the top counterparty by count", () => {
    const a = askAether(kundli({}), txs, "who do I send to most")
    expect(a.intent).toBe("counterparty")
    expect(a.text).toContain("2 transfers")
  })

  it("explains the score with its top factor", () => {
    const a = askAether(kundli({ score: 350 }), txs, "why is my score that number")
    expect(a.intent).toBe("score")
    expect(a.text).toContain("350/1000")
  })

  it("reports failed transactions honestly both ways", () => {
    expect(askAether(kundli({}), txs, "any failed tx").text).toMatch(/1 of your recent/)
    expect(askAether(kundli({}), [tx({ status: "ok" })], "failed?").text).toMatch(/None/)
  })

  it("gives a helpful fallback for unknown questions", () => {
    const a = askAether(kundli({}), txs, "tell me a joke")
    expect(a.intent).toBe("unknown")
    expect(a.text.length).toBeGreaterThan(0)
  })
})

describe("isFollowUp", () => {
  it("detects connective and bare follow-ups", () => {
    expect(isFollowUp("and received?")).toBe(true)
    expect(isFollowUp("what about that?")).toBe(true)
    expect(isFollowUp("why?")).toBe(true)
    expect(isFollowUp("how come")).toBe(true)
  })
  it("is false for standalone questions", () => {
    expect(isFollowUp("what's my balance")).toBe(false)
    expect(isFollowUp("")).toBe(false)
    expect(isFollowUp("why is my score so low and what can I do about it exactly")).toBe(false)
  })
})

describe("classifyInContext", () => {
  it("inherits the prior intent for a bare follow-up", () => {
    // "why?" alone is unknown, but after a score question it stays score.
    expect(classify("why?")).toBe("unknown")
    expect(classifyInContext("why?", "score")).toBe("score")
  })
  it("prefers a new concrete intent over the prior one", () => {
    // "and received?" names its own intent — inherit nothing.
    expect(classifyInContext("and received?", "balance")).toBe("received")
  })
  it("does not inherit for help/unknown prior intents", () => {
    expect(classifyInContext("why?", "help")).toBe("unknown")
    expect(classifyInContext("why?", null)).toBe("unknown")
  })
})

describe("askAether — conversational context", () => {
  it("answers a follow-up using the prior intent", () => {
    const a = askAether(kundli({ score: 350 }), [], "why?", "score")
    expect(a.intent).toBe("score")
    expect(a.text).toContain("350/1000")
  })
})
