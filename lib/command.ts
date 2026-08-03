// Agentic command parsing for the AI Workspace (File 05/09). Detects when a
// user's message is an ACTION request ("send 5 USDC to 0x…", "open my
// portfolio") rather than a question, and returns a structured, user-confirmed
// action. AETHER never executes silently — a command becomes a card the user
// taps to confirm, and any signing still happens in their own wallet (File 09).

export type Command =
  | { kind: "transfer"; amount: string; to: string; href: string; label: string }
  | { kind: "navigate"; label: string; href: string }

// The subset of the Address Book a command resolver needs: an id for keying
// the per-contact existence check plus the label/address used to resolve names.
export interface CommandContact {
  id: string
  label: string
  address: string
}

const ADDR = /0x[a-fA-F0-9]{40}/
// "send 5 USDC to 0x…" / "transfer 10 to 0x…" / "pay 2.5 usdc to 0x…"
const TRANSFER = /\b(?:send|transfer|pay)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:usdc)?\s+to\s+(0x[a-fA-F0-9]{40})/i
// Name-form transfer intent — "send 5 USDC to Alice" — resolved against the
// saved Address Book by resolveCommand (never silently executed).
const TRANSFER_NAMED = /\b(?:send|transfer|pay)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:usdc)?\s+to\s+([a-zA-Z][a-zA-Z0-9 _-]{0,30})/i

// Navigation targets the assistant can open directly.
const ROUTES: { test: RegExp; href: string; label: string }[] = [
  { test: /\b(dashboard|home)\b/, href: "/dashboard", label: "Open dashboard" },
  { test: /\b(portfolio|holdings|balance page)\b/, href: "/portfolio", label: "Open portfolio" },
  { test: /\b(activity|history|transactions? list)\b/, href: "/activity", label: "Open activity" },
  { test: /\b(analytics|breakdown|stats)\b/, href: "/analytics", label: "Open analytics" },
  { test: /\b(transfer|send)\b/, href: "/transfer", label: "Open transfer" },
]

// Parse a message into a command, or null if it isn't one. Transfer intent
// (which carries data) takes precedence over bare navigation.
export function parseCommand(message: string): Command | null {
  const text = message.trim()
  if (!text) return null

  const t = TRANSFER.exec(text)
  if (t) {
    const amount = t[1]
    const to = t[2]
    const href = `/transfer?to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`
    return { kind: "transfer", amount, to, href, label: `Review sending ${amount} USDC` }
  }

  // Only treat as navigation when the message reads like a command, not a
  // question ("open/go to/show my portfolio", not "what's in my portfolio").
  if (/\b(open|go to|goto|show|take me to|navigate)\b/i.test(text)) {
    const lower = text.toLowerCase()
    for (const r of ROUTES) {
      if (r.test.test(lower)) return { kind: "navigate", href: r.href, label: r.label }
    }
  }
  return null
}

// Build a contact-aware transfer command. Two jobs:
//  1. If `to` is a saved contact's name ("send 5 to Alice"), resolve it to the
//     contact's real address and label the confirm card with the name.
//  2. If `to` is an address the user has saved, surface the saved name on the
//     card and in the summary line instead of a raw hex.
// Returns null when nothing resolves (unknown name / no match), so the caller
// can fall back to a plain question answer. Pure and deterministic.
export function resolveCommand(message: string, contacts: CommandContact[]): Command | null {
  const text = message.trim()
  if (!text) return null

  // 1. Named recipient — "send N USDC to Alice". Match against lowercased
  //    labels, but read the display name from the original contact so the
  //    confirm card keeps the user's exact spelling.
  const named = TRANSFER_NAMED.exec(text)
  if (named) {
    const amount = named[1]
    const name = named[2].trim().toLowerCase()
    const contact = contacts.find((c) => {
      const l = c.label.toLowerCase()
      return l === name || l.includes(name) || name.includes(l)
    })
    if (contact) {
      const href = `/transfer?to=${encodeURIComponent(contact.address)}&amount=${encodeURIComponent(amount)}`
      return { kind: "transfer", amount, to: contact.address, href, label: `Review sending ${amount} USDC to ${contact.label}` }
    }
    return null
  }

  // 2. Address form — surface the saved name when the recipient is a contact.
  const t = TRANSFER.exec(text)
  if (t) {
    const amount = t[1]
    const to = t[2]
    const contact = contacts.find((c) => c.address.toLowerCase() === to.toLowerCase())
    const label = contact ? `Review sending ${amount} USDC to ${contact.label}` : `Review sending ${amount} USDC`
    const href = `/transfer?to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`
    return { kind: "transfer", amount, to, href, label }
  }

  return null
}
