// Preferences model — a small, pure, testable core for AETHER's Settings
// surface (File 03 OS navigation, File 05 accessibility, File 16 honesty).
// No React, no direct DOM. The view + hooks read/write through these helpers so
// preference logic is tested in isolation and behaves identically everywhere.

export type MotionPref = "system" | "reduce" | "full"

export const MOTION_KEY = "af_motion"
export const SOUND_KEY = "af_sound"

// Event dispatched on the window whenever a preference changes, so live
// consumers (e.g. useReducedMotion) update without a reload.
export const PREFS_EVENT = "af:prefs"

export function isMotionPref(v: unknown): v is MotionPref {
  return v === "system" || v === "reduce" || v === "full"
}

// Resolve the effective "reduce motion" boolean from the stored preference and
// the OS setting. "system" defers to the OS; explicit choices always win.
export function resolveReducedMotion(pref: MotionPref, systemReduced: boolean): boolean {
  if (pref === "reduce") return true
  if (pref === "full") return false
  return systemReduced
}

// Ambient sound is persisted as "1"/"0" (see SoundToggle, the header control
// that owns the Web Audio pad). These helpers keep every surface that reads or
// writes the preference in exact agreement — no separate, drifting definition.
export const SOUND_ON = "1"
export const SOUND_OFF = "0"

export function isSoundOn(raw: string | null): boolean {
  return raw === SOUND_ON
}

export function soundValue(on: boolean): string {
  return on ? SOUND_ON : SOUND_OFF
}

// A single localStorage entry AETHER owns, described honestly for the Privacy
// panel. `match` decides which live keys belong to this entry (some are
// per-address or per-scope prefixes).
export interface DataEntry {
  id: string
  label: string
  detail: string
  match: (key: string) => boolean
}

// Everything AETHER may persist locally. Kept in one place so the Settings
// Privacy section can enumerate real storage — never a fabricated list.
export const DATA_ENTRIES: DataEntry[] = [
  { id: "motion", label: "Motion preference", detail: "Your animation choice (system / reduced / full).", match: (k) => k === MOTION_KEY },
  { id: "sound", label: "Ambient sound", detail: "Whether the ambient audio pad is on.", match: (k) => k === SOUND_KEY },
  { id: "unlocks", label: "Unlocked modes", detail: "God mode and Arc Insider unlock flags.", match: (k) => k === "af_god" || k === "af_arc" },
  { id: "boost", label: "Aura boosts", detail: "Per-wallet aura boost counters.", match: (k) => k.startsWith("af_boost_") },
  { id: "snapshots", label: "Portfolio snapshots", detail: "Last balance snapshot per wallet, used for trend deltas.", match: (k) => k.startsWith("aether.portfolio.snap.") },
  { id: "workflow", label: "Workflow drafts", detail: "Saved builder-canvas workflow state.", match: (k) => k === "aether.workflow.v1" || k.startsWith("aether.workflow") },
  { id: "automation", label: "Automation rules", detail: "Your scheduled payment reminders, per wallet.", match: (k) => k.startsWith("aether.automation.") },
  { id: "contacts", label: "Address book", detail: "Your saved recipient contacts, per wallet.", match: (k) => k.startsWith("aether.contacts.") },
  { id: "notif", label: "Notification state", detail: "Which alerts you've read or dismissed, per wallet.", match: (k) => k.startsWith("aether.notif.") },
]

// True if a key is one AETHER created (any known entry claims it). Used to clear
// only our own data and never touch unrelated localStorage.
export function isAetherKey(key: string): boolean {
  return DATA_ENTRIES.some((e) => e.match(key))
}

// Group a snapshot of localStorage keys into the known entries, counting how
// many live keys each represents. Pure — the view passes in `Object.keys`.
export interface DataSummaryRow {
  id: string
  label: string
  detail: string
  count: number
}
export function summarizeData(keys: string[]): DataSummaryRow[] {
  return DATA_ENTRIES.map((e) => ({
    id: e.id,
    label: e.label,
    detail: e.detail,
    count: keys.filter((k) => e.match(k)).length,
  }))
}

// The subset of a key list that AETHER owns — exactly what clearing removes.
export function aetherKeys(keys: string[]): string[] {
  return keys.filter(isAetherKey)
}
