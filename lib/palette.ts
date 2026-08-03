import { parseCommand } from "@/lib/command"

// Command palette core (File 03 OS navigation) — the ⌘K surface that turns any
// route or quick action into one keystroke. Pure + testable: the action
// registry and the fuzzy matcher live here with no React, so ranking is unit-
// tested and the component just renders what filterActions() returns. Transfer
// intent typed into the palette is parsed by the SAME command engine the
// assistant uses (lib/command.ts), so "send 5 to 0x…" becomes a real,
// user-confirmed transfer — never auto-signed (File 09/16).

export type ActionKind = "navigate" | "transfer"

export interface PaletteAction {
  id: string
  label: string
  hint?: string // secondary text (section / description)
  href: string
  kind: ActionKind
  keywords: string[] // extra match terms beyond the label
}

// Static navigation + quick actions. Order here is the default (empty-query)
// order shown in the palette. "Soon" routes are intentionally omitted — the
// palette never offers a destination that doesn't exist (File 16 honesty).
export const PALETTE_ACTIONS: PaletteAction[] = [
  { id: "nav-dashboard", label: "Dashboard", hint: "Overview & insights", href: "/dashboard", kind: "navigate", keywords: ["home", "overview", "start"] },
  { id: "nav-aura", label: "Reveal Aura", hint: "Your generative wallet aura", href: "/", kind: "navigate", keywords: ["reveal", "art", "visual"] },
  { id: "nav-portfolio", label: "Portfolio", hint: "Holdings & balances", href: "/portfolio", kind: "navigate", keywords: ["holdings", "balance", "tokens", "assets"] },
  { id: "nav-transfer", label: "Send USDC", hint: "Transfer funds", href: "/transfer", kind: "navigate", keywords: ["send", "pay", "transfer", "money"] },
  { id: "nav-automation", label: "Automation", hint: "Scheduled payments", href: "/automation", kind: "navigate", keywords: ["schedule", "recurring", "rules", "reminders"] },
  { id: "nav-contacts", label: "Address Book", hint: "Saved recipients", href: "/contacts", kind: "navigate", keywords: ["contacts", "recipients", "people", "addresses", "book"] },
  { id: "nav-activity", label: "Activity", hint: "Transaction history", href: "/activity", kind: "navigate", keywords: ["history", "transactions", "feed"] },
  { id: "nav-analytics", label: "Analytics", hint: "Score breakdown & stats", href: "/analytics", kind: "navigate", keywords: ["stats", "score", "breakdown", "charts"] },
  { id: "nav-assistant", label: "AI Assistant", hint: "Ask AetherFI anything", href: "/assistant", kind: "navigate", keywords: ["ai", "chat", "ask", "help"] },
  { id: "nav-security", label: "Security", hint: "Safety & self-custody", href: "/security", kind: "navigate", keywords: ["safety", "custody", "privacy"] },
  { id: "nav-developer", label: "Developer", hint: "API & tools", href: "/developer", kind: "navigate", keywords: ["api", "tools", "code", "mcp"] },
  { id: "nav-settings", label: "Settings", hint: "Preferences & data", href: "/settings", kind: "navigate", keywords: ["preferences", "config", "motion", "sound"] },
]

// Subsequence fuzzy match: do the query chars appear in order within `text`?
// Returns a score (lower = tighter/earlier match) or null for no match. Exact
// prefix and word-boundary hits are boosted so "por" ranks Portfolio first.
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  if (t === q) return -100
  if (t.startsWith(q)) return -50
  const wordStart = t.split(/[\s/]+/).some((w) => w.startsWith(q))
  let ti = 0
  let first = -1
  let gaps = 0
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi]
    let found = -1
    for (; ti < t.length; ti++) {
      if (t[ti] === c) {
        found = ti
        break
      }
    }
    if (found === -1) return null
    if (first === -1) first = found
    if (qi > 0 && found > 0 && t[found - 1] !== " ") gaps++
    ti = found + 1
  }
  return first + gaps * 2 - (wordStart ? 20 : 0)
}

// Best score of a query against an action's label + keywords + hint.
function scoreAction(query: string, a: PaletteAction): number | null {
  const targets = [a.label, ...a.keywords, a.hint ?? ""]
  let best: number | null = null
  for (const target of targets) {
    const s = fuzzyScore(query, target)
    if (s !== null && (best === null || s < best)) best = s
  }
  return best
}

// Rank the registry against a query. Empty query returns the default order.
// A recognized transfer command is prepended as a live, data-carrying action.
export function filterActions(query: string, actions: PaletteAction[] = PALETTE_ACTIONS): PaletteAction[] {
  const text = query.trim()
  const results: PaletteAction[] = []

  // Typed transfer intent becomes a first-class action (reuses lib/command).
  const cmd = parseCommand(text)
  if (cmd && cmd.kind === "transfer") {
    results.push({
      id: "cmd-transfer",
      label: `Send ${cmd.amount} USDC`,
      hint: `to ${cmd.to.slice(0, 10)}…${cmd.to.slice(-6)} — review & sign`,
      href: cmd.href,
      kind: "transfer",
      keywords: [],
    })
  }

  if (!text) return [...results, ...actions]

  const scored = actions
    .map((a) => ({ a, s: scoreAction(text, a) }))
    .filter((x): x is { a: PaletteAction; s: number } => x.s !== null)
    .sort((x, y) => x.s - y.s)
    .map((x) => x.a)

  return [...results, ...scored]
}
