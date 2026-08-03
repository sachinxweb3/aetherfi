// Dashboard modes. Each changes the vibe and what the user sees.
// Some are always available, some unlock via score, konami, or a secret phrase.

export type ModeId = "aura" | "zen" | "builder" | "legend" | "god" | "arc"

export interface ModeDef {
  id: ModeId
  label: string
  /** Icon registry key resolved to a Lucide line icon at render time. */
  icon: string
  blurb: string
  /** How it unlocks (shown in UI). */
  unlock: "default" | "score" | "konami" | "secret"
}

export const MODES: ModeDef[] = [
  { id: "aura", label: "Aura", icon: "sparkles", blurb: "Your living on-chain identity", unlock: "default" },
  { id: "zen", label: "Zen", icon: "zen", blurb: "Minimal. Just you and your aura", unlock: "default" },
  { id: "builder", label: "Builder", icon: "wrench", blurb: "Raw data, APIs, and MCP setup", unlock: "default" },
  { id: "legend", label: "Legend", icon: "crown", blurb: "For score 800+ wallets", unlock: "score" },
  { id: "god", label: "God", icon: "sparkles", blurb: "Konami code unlocks it", unlock: "konami" },
  { id: "arc", label: "Arc Insider", icon: "rocket", blurb: "Arc team ecosystem view", unlock: "secret" },
]

// Secret phrase to unlock Arc Insider mode (share with the Arc team).
export const ARC_SECRET = "arcteam"

export function modeById(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id) ?? MODES[0]
}
