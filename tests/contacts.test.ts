import { describe, it, expect } from "vitest"
import {
  validateContact, createContact, applyEdit, sortContacts, searchContacts,
  contactFor, sendHref, normalizeAddress, storageKey, isContactsKey,
  statsByAddress, statsFor, rankByActivity, addContact,
  type Contact, type ContactDraft,
} from "../lib/contacts"
import type { ArcTx } from "../lib/arc"

const A = "0x1111111111111111111111111111111111111111"
const B = "0x2222222222222222222222222222222222222222"

const draft = (over: Partial<ContactDraft> = {}): ContactDraft => ({
  label: "Alice",
  address: A,
  note: "",
  ...over,
})

const contact = (over: Partial<Contact> = {}): Contact => ({
  ...createContact(draft(), "c1", "2026-08-01T00:00:00Z"),
  ...over,
})

describe("validateContact", () => {
  it("accepts a labeled, valid, non-duplicate address", () => {
    expect(validateContact(draft()).ready).toBe(true)
  })

  it("rejects an empty label", () => {
    const v = validateContact(draft({ label: "  " }))
    expect(v.labelValid).toBe(false)
    expect(v.ready).toBe(false)
  })

  it("rejects an invalid address", () => {
    const v = validateContact(draft({ address: "0xnope" }))
    expect(v.addrValid).toBe(false)
    expect(v.ready).toBe(false)
  })

  it("flags a duplicate address regardless of surrounding whitespace", () => {
    const existing = [contact({ id: "c1", address: normalizeAddress(A) })]
    const v = validateContact(draft({ address: `  ${A}  ` }), existing)
    expect(v.duplicate).toBe(true)
    expect(v.ready).toBe(false)
  })

  it("does not flag the contact being edited as its own duplicate", () => {
    const existing = [contact({ id: "c1", address: normalizeAddress(A) })]
    const v = validateContact(draft({ address: A }), existing, "c1")
    expect(v.duplicate).toBe(false)
    expect(v.ready).toBe(true)
  })
})

describe("createContact / applyEdit", () => {
  it("normalizes and trims on create", () => {
    const c = createContact(draft({ label: "  Bob ", address: B.toUpperCase(), note: " pal " }), "c9", "2026-08-02T00:00:00Z")
    expect(c.label).toBe("Bob")
    expect(c.address).toBe(B)
    expect(c.note).toBe("pal")
    expect(c.id).toBe("c9")
  })

  it("applyEdit updates fields immutably", () => {
    const c = contact()
    const edited = applyEdit(c, draft({ label: "Alice 2", address: B, note: "moved" }))
    expect(edited.label).toBe("Alice 2")
    expect(edited.address).toBe(B)
    expect(edited.id).toBe(c.id)
    expect(c.label).toBe("Alice") // original untouched
  })
})

describe("addContact — dedup on save", () => {
  it("prepends a new valid contact", () => {
    const next = addContact([], draft({ label: "Alice", address: A }), "n1", "2026-08-02T00:00:00Z")
    expect(next).not.toBeNull()
    expect(next?.[0].label).toBe("Alice")
    expect(next?.[0].address).toBe(normalizeAddress(A))
  })

  it("returns null when the address is already saved", () => {
    const existing = [contact({ id: "c1", address: normalizeAddress(A) })]
    expect(addContact(existing, draft({ label: "Dup", address: A }), "n2", "2026-08-02T00:00:00Z")).toBeNull()
  })

  it("returns null for an invalid draft", () => {
    expect(addContact([], draft({ label: "", address: "0xnope" }), "n3", "2026-08-02T00:00:00Z")).toBeNull()
  })

  it("does not mutate the existing list", () => {
    const existing = [contact({ id: "c1", address: B })]
    addContact(existing, draft({ label: "Alice", address: A }), "n4", "2026-08-02T00:00:00Z")
    expect(existing.length).toBe(1)
  })
})

describe("sort / search / lookup", () => {
  const list = [
    contact({ id: "1", label: "Charlie", address: A }),
    contact({ id: "2", label: "alice", address: B, note: "landlord" }),
  ]

  it("sorts case-insensitively by label", () => {
    expect(sortContacts(list).map((c) => c.label)).toEqual(["alice", "Charlie"])
  })

  it("searches label, note, and address", () => {
    expect(searchContacts(list, "land").map((c) => c.id)).toEqual(["2"])
    expect(searchContacts(list, "charl").map((c) => c.id)).toEqual(["1"])
    expect(searchContacts(list, B.slice(0, 6)).map((c) => c.id)).toEqual(["2"])
    expect(searchContacts(list, "").length).toBe(2)
  })

  it("contactFor matches an address case-insensitively", () => {
    expect(contactFor(list, A.toUpperCase())?.label).toBe("Charlie")
    expect(contactFor(list, "0x9999999999999999999999999999999999999999")).toBeNull()
  })
})

describe("sendHref", () => {
  it("deep-links into the transfer flow", () => {
    expect(sendHref(contact({ address: A }))).toBe(`/transfer?to=${encodeURIComponent(A)}`)
  })
})

describe("persistence keys", () => {
  it("namespaces per lowercased address", () => {
    const k = storageKey("0xABCDEF0000000000000000000000000000000000")
    expect(k).toBe("aether.contacts.0xabcdef0000000000000000000000000000000000")
    expect(isContactsKey(k)).toBe(true)
    expect(isContactsKey("aether.notif.0xabc")).toBe(false)
  })
})

describe("statsByAddress / statsFor — relationship stats from real activity", () => {
  const tx = (over: Partial<ArcTx>): ArcTx => ({
    hash: "0x", timestamp: "2026-08-01T00:00:00Z", from: "0xself", to: A,
    direction: "out", valueUSDC: 0, feeUSDC: 0, status: "ok", method: null,
    blockNumber: null, ...over,
  })
  const txs: ArcTx[] = [
    tx({ direction: "out", valueUSDC: 10, timestamp: "2026-08-01T00:00:00Z" }),
    tx({ direction: "in", from: A, to: "0xself", valueUSDC: 5, timestamp: "2026-08-02T00:00:00Z" }),
    tx({ direction: "out", valueUSDC: 2.5, timestamp: "2026-07-30T00:00:00Z" }),
    tx({ direction: "self", timestamp: "2026-08-01T00:00:00Z" }),
    tx({ direction: "out", valueUSDC: 99, status: "error", timestamp: "2026-08-03T00:00:00Z" }),
    tx({ direction: "in", from: B, to: "0xself", valueUSDC: 7, timestamp: "2026-07-29T00:00:00Z" }),
  ]

  it("sums sent/received, counts interactions, and tracks the last timestamp per counterparty", () => {
    const map = statsByAddress(txs)
    const s = map.get(A.toLowerCase())
    expect(s?.txCount).toBe(3) // error tx excluded
    expect(s?.totalSent).toBe(12.5)
    expect(s?.totalReceived).toBe(5)
    expect(s?.lastTs).toBe("2026-08-02T00:00:00Z") // error tx's later ts ignored
    expect(map.get(B.toLowerCase())?.totalReceived).toBe(7)
  })

  it("keys are lowercased so contact lookups always match", () => {
    const map = statsByAddress(txs)
    expect(map.has(A.toUpperCase())).toBe(false)
    expect(map.has(A.toLowerCase())).toBe(true)
  })

  it("statsFor returns the saved numbers for a contact and empty stats otherwise", () => {
    const map = statsByAddress(txs)
    expect(statsFor(map, contact({ id: "c1", address: A })).totalSent).toBe(12.5)
    const fresh = statsFor(map, contact({ id: "c2", address: "0x9999999999999999999999999999999999999999" }))
    expect(fresh).toEqual({ txCount: 0, totalSent: 0, totalReceived: 0, lastTs: null })
  })

  it("yields empty stats for an empty feed", () => {
    expect([...statsByAddress([]).entries()]).toEqual([])
  })
})

describe("rankByActivity", () => {
  const C = "0x3333333333333333333333333333333333333333"
  const list = [
    contact({ id: "1", label: "Alice", address: A }),
    contact({ id: "2", label: "Bob", address: B }),
    contact({ id: "3", label: "Carol", address: C }),
  ]

  it("orders by interaction count, then recency, then name", () => {
    const map = new Map([
      [A, { txCount: 2, totalSent: 0, totalReceived: 0, lastTs: "2026-07-01T00:00:00Z" }],
      [B, { txCount: 5, totalSent: 0, totalReceived: 0, lastTs: "2026-06-01T00:00:00Z" }],
      // Carol has no stats — should fall to the bottom.
    ])
    expect(rankByActivity(list, map).map((c) => c.label)).toEqual(["Bob", "Alice", "Carol"])
  })

  it("breaks equal counts by most-recent contact", () => {
    const map = new Map([
      [A, { txCount: 3, totalSent: 0, totalReceived: 0, lastTs: "2026-05-01T00:00:00Z" }],
      [B, { txCount: 3, totalSent: 0, totalReceived: 0, lastTs: "2026-08-01T00:00:00Z" }],
    ])
    expect(rankByActivity(list, map).slice(0, 2).map((c) => c.label)).toEqual(["Bob", "Alice"])
  })

  it("does not mutate the input array", () => {
    const map = new Map<string, ReturnType<typeof statsFor>>()
    const before = list.map((c) => c.id)
    rankByActivity(list, map)
    expect(list.map((c) => c.id)).toEqual(before)
  })
})
