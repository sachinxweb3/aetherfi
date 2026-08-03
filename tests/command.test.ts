import { describe, it, expect } from "vitest"
import { parseCommand, resolveCommand, type CommandContact } from "../lib/command"

// Agentic command parsing (File 05/09) — user-confirmed actions, never silent.
const ADDR = "0x1234567890abcdef1234567890abcdef12345678"

describe("parseCommand — transfer", () => {
  it("parses 'send N USDC to 0x…'", () => {
    const c = parseCommand(`send 5 USDC to ${ADDR}`)
    expect(c?.kind).toBe("transfer")
    if (c?.kind === "transfer") {
      expect(c.amount).toBe("5")
      expect(c.to).toBe(ADDR)
      expect(c.href).toContain(`to=${ADDR}`)
      expect(c.href).toContain("amount=5")
    }
  })
  it("handles decimals and 'transfer'/'pay' verbs without the USDC word", () => {
    expect(parseCommand(`transfer 2.5 to ${ADDR}`)?.kind).toBe("transfer")
    expect(parseCommand(`pay 10 usdc to ${ADDR}`)?.kind).toBe("transfer")
  })
  it("ignores a transfer with no valid address", () => {
    expect(parseCommand("send 5 usdc to alice")).toBeNull()
  })
})

describe("parseCommand — navigation", () => {
  it("opens known routes on command verbs", () => {
    expect(parseCommand("open my portfolio")).toEqual({ kind: "navigate", href: "/portfolio", label: "Open portfolio" })
    expect(parseCommand("go to analytics")?.href).toBe("/analytics")
    expect(parseCommand("show activity")?.href).toBe("/activity")
  })
  it("does NOT treat questions as navigation", () => {
    expect(parseCommand("what's in my portfolio?")).toBeNull()
    expect(parseCommand("how much is my balance")).toBeNull()
  })
})

describe("parseCommand — non-commands", () => {
  it("returns null for empty or plain questions", () => {
    expect(parseCommand("")).toBeNull()
    expect(parseCommand("why is my score that number")).toBeNull()
  })
})

// Contact-aware resolution (Address Book): names resolve to addresses, known
// addresses surface their saved name, unknown names stay a plain question.
const CONTACTS: CommandContact[] = [
  { id: "1", label: "Alice", address: ADDR },
  { id: "2", label: "Bob", address: "0x2222222222222222222222222222222222222222" },
]

describe("resolveCommand — named recipient resolves to a saved contact", () => {
  it("resolves 'send N USDC to Alice' to Alice's address", () => {
    const c = resolveCommand(`send 5 USDC to Alice`, CONTACTS)
    expect(c?.kind).toBe("transfer")
    if (c?.kind === "transfer") {
      expect(c.to).toBe(ADDR)
      expect(c.amount).toBe("5")
      expect(c.href).toContain(`to=${ADDR}`)
      expect(c.label).toContain("Alice")
    }
  })
  it("is case-insensitive and tolerates multi-word labels", () => {
    const multi = [{ id: "3", label: "Rent Landlord", address: "0x3333333333333333333333333333333333333333" }]
    const c = resolveCommand("pay 120 to RENT LANDLORD", multi)
    expect(c?.kind).toBe("transfer")
    if (c?.kind === "transfer") expect(c.to).toBe("0x3333333333333333333333333333333333333333")
  })
  it("returns null for an unknown name so it stays a plain question", () => {
    expect(resolveCommand("send 5 usdc to Carol", CONTACTS)).toBeNull()
  })
})

describe("resolveCommand — known address surfaces the saved name", () => {
  it("labels the confirm card with the contact name", () => {
    const c = resolveCommand(`send 5 USDC to ${ADDR}`, CONTACTS)
    expect(c?.kind).toBe("transfer")
    if (c?.kind === "transfer") expect(c.label).toBe("Review sending 5 USDC to Alice")
  })
  it("labels with a short address when the recipient is not saved", () => {
    const c = resolveCommand("send 5 usdc to 0x9999999999999999999999999999999999999999", CONTACTS)
    expect(c?.kind).toBe("transfer")
    if (c?.kind === "transfer") expect(c.label).toBe("Review sending 5 USDC")
  })
})

