import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  REVEAL_ORDER,
  REVEAL_MS,
  revealDuration,
  nextPhase,
  isRevealDone,
  financialDna,
  revealSeenThisSession,
  markRevealSeen,
  type RevealPhase,
} from "../lib/reveal"
import type { WalletKundli, ArcTx } from "../lib/arc"

// Pure core of the signature onboarding reveal — the sequence, its timing, the
// once-per-session gate, and the Financial DNA composed from real wallet data.

const kundli = (over: Partial<WalletKundli>): WalletKundli => ({
  address: "0xSELF", balanceUSDC: 100, txCount: 10, gasUsed: 1000, tokenTransfers: 2,
  walletAgeDays: 30, score: 742, rank: "Steward", percentile: 80,
  badges: [], activityByDay: Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, count: 0 })),
  ...over,
})
const tx = (over: Partial<ArcTx>): ArcTx => ({
  hash: "0x", timestamp: null, from: "0xa", to: "0xb", direction: "in",
  valueUSDC: 0, feeUSDC: 0, status: "ok", method: null, blockNumber: null, ...over,
})

describe("reveal sequence", () => {
  it("orders the beats: hold → line → dna → score → insight → dashboard", () => {
    expect(REVEAL_ORDER).toEqual(["hold", "line", "dna", "score", "insight", "dashboard"])
  })

  it("holds within the 700–1200ms window the brief requires", () => {
    expect(REVEAL_MS.hold).toBeGreaterThanOrEqual(700)
    expect(REVEAL_MS.hold).toBeLessThanOrEqual(1200)
  })

  it("reveals the score before the insight", () => {
    expect(REVEAL_ORDER.indexOf("score")).toBeLessThan(REVEAL_ORDER.indexOf("insight"))
  })

  it("advances to the next phase and terminates at dashboard", () => {
    expect(nextPhase("hold")).toBe("line")
    expect(nextPhase("score")).toBe("insight")
    expect(nextPhase("insight")).toBe("dashboard")
    expect(nextPhase("dashboard")).toBeNull()
  })

  it("marks only the terminal phase as done", () => {
    for (const p of REVEAL_ORDER) {
      expect(isRevealDone(p)).toBe(p === "dashboard")
    }
  })

  it("sums a positive, finite total duration", () => {
    const total = revealDuration()
    expect(total).toBe(REVEAL_ORDER.reduce((s, p: RevealPhase) => s + REVEAL_MS[p], 0))
    expect(total).toBeGreaterThan(0)
    expect(Number.isFinite(total)).toBe(true)
  })
})

describe("financialDna", () => {
  it("composes a strand from real fields only — rank, score, top percentile", () => {
    const dna = financialDna(kundli({}), [])
    expect(dna.score).toBe(742)
    expect(dna.rank).toBe("Steward")
    expect(dna.strand).toBe("STEWARD · 742 · TOP 20%")
  })

  it("clamps the top percentile to at least 1%", () => {
    const dna = financialDna(kundli({ percentile: 100 }), [])
    expect(dna.strand).toMatch(/TOP 1%$/)
  })

  it("carries the same deterministic insight the hero uses", () => {
    const txs = [tx({ status: "error", direction: "out" })]
    const dna = financialDna(kundli({}), txs)
    expect(dna.insight.tone).toBe("caution")
    expect(dna.insight.headline).toMatch(/failed/)
  })

  it("is pure — same wallet data yields the same DNA", () => {
    const k = kundli({})
    expect(financialDna(k, [])).toEqual(financialDna(k, []))
  })
})

describe("once-per-session gate", () => {
  // The harness runs in a Node environment (no browser window). Provide a
  // minimal in-memory sessionStorage so the gate's storage path is exercised;
  // the module's `typeof window` guard keeps it SSR-safe regardless.
  const store = new Map<string, string>()
  const sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    clear: () => store.clear(),
  }

  beforeEach(() => {
    store.clear()
    ;(globalThis as Record<string, unknown>).window = { sessionStorage }
  })
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window
  })

  it("is unseen for a fresh wallet, then seen after marking", () => {
    expect(revealSeenThisSession("0xAbC")).toBe(false)
    markRevealSeen("0xAbC")
    expect(revealSeenThisSession("0xAbC")).toBe(true)
  })

  it("keys per address, case-insensitively", () => {
    markRevealSeen("0xABC")
    expect(revealSeenThisSession("0xabc")).toBe(true)
    expect(revealSeenThisSession("0xdef")).toBe(false)
  })

  it("is SSR-safe: reports seen when there is no window (server/prerender)", () => {
    delete (globalThis as Record<string, unknown>).window
    expect(revealSeenThisSession("0xabc")).toBe(true)
    expect(() => markRevealSeen("0xabc")).not.toThrow()
  })
})
