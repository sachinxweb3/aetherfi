import { describe, it, expect } from "vitest"
import {
  shouldAutoRefresh, refreshInterval, secondsUntilNext,
  REFRESH_INTERVAL_MS, REFRESH_BACKOFF_MS,
} from "../lib/liveRefresh"

// Focus-aware live-refresh policy — pure timing logic (File 06, File 16).
describe("shouldAutoRefresh", () => {
  const base = { visible: true, connected: true, onArc: true, inFlight: false }
  it("refreshes only when visible, connected, on Arc, and idle", () => {
    expect(shouldAutoRefresh(base)).toBe(true)
  })
  it("pauses when the tab is hidden", () => {
    expect(shouldAutoRefresh({ ...base, visible: false })).toBe(false)
  })
  it("does not refresh when disconnected, off-chain, or in flight", () => {
    expect(shouldAutoRefresh({ ...base, connected: false })).toBe(false)
    expect(shouldAutoRefresh({ ...base, onArc: false })).toBe(false)
    expect(shouldAutoRefresh({ ...base, inFlight: true })).toBe(false)
  })
})

describe("refreshInterval", () => {
  it("uses the baseline cadence when healthy and backs off on error", () => {
    expect(refreshInterval(false)).toBe(REFRESH_INTERVAL_MS)
    expect(refreshInterval(true)).toBe(REFRESH_BACKOFF_MS)
    expect(REFRESH_BACKOFF_MS).toBeGreaterThan(REFRESH_INTERVAL_MS)
  })
})

describe("secondsUntilNext", () => {
  it("counts down from the interval and clamps at zero", () => {
    const last = 1_000_000
    expect(secondsUntilNext(last, last, 60_000)).toBe(60)
    expect(secondsUntilNext(last, last + 15_000, 60_000)).toBe(45)
    expect(secondsUntilNext(last, last + 60_000, 60_000)).toBe(0)
    expect(secondsUntilNext(last, last + 999_000, 60_000)).toBe(0)
  })
  it("never exceeds the interval even if the clock runs backward", () => {
    expect(secondsUntilNext(1_000_000, 900_000, 60_000)).toBe(60)
  })
})
