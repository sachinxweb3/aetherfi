// Live-refresh timing helpers for the dashboard (File 06 intelligence, File 11
// motion/UX). Pure + deterministic so the polling policy is unit-testable
// without React or timers. The dashboard treats wallet data as a live feed:
// poll only while the tab is visible, back off on errors, never hammer the RPC.

export const REFRESH_INTERVAL_MS = 60_000 // baseline cadence while focused
export const REFRESH_BACKOFF_MS = 120_000 // slower cadence after an error

// Should we auto-refresh right now? Only when the tab is visible, the wallet is
// connected on Arc, and nothing is already in flight.
export function shouldAutoRefresh(opts: {
  visible: boolean
  connected: boolean
  onArc: boolean
  inFlight: boolean
}): boolean {
  return opts.visible && opts.connected && opts.onArc && !opts.inFlight
}

// Cadence in ms given current health — back off while an error persists so a
// flaky RPC isn't polled every minute.
export function refreshInterval(hasError: boolean): number {
  return hasError ? REFRESH_BACKOFF_MS : REFRESH_INTERVAL_MS
}

// Seconds remaining until the next scheduled refresh, clamped to [0, interval].
export function secondsUntilNext(lastMs: number, nowMs: number, intervalMs: number): number {
  const elapsed = Math.max(0, nowMs - lastMs)
  const remaining = Math.ceil((intervalMs - elapsed) / 1000)
  return Math.max(0, Math.min(Math.round(intervalMs / 1000), remaining))
}
