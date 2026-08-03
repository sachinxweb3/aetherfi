import { isValidRecipient, shortAddr } from "@/lib/transfer"
import type { ArcTx } from "@/lib/arc"

// Address Book — saved recipients for fast, safe transfers (File 02 core
// module, File 11 transaction safety). A contact is just a label + a validated
// 0x address; selecting one hands its address to the existing transfer flow,
// where the user still reviews and signs (AETHER never auto-sends). Pure +
// serializable — no React, no DOM — so validation/dedup/sort are unit-tested
// and the view/persistence layers stay thin. Mirrors lib/automation key style.

export interface Contact {
  id: string
  label: string
  address: string // validated 0x, stored lowercased
  note: string // optional freeform, e.g. "landlord"
  createdAt: string // ISO
}

export interface ContactDraft {
  label: string
  address: string
  note: string
}

export interface ContactValidation {
  labelValid: boolean
  addrValid: boolean
  duplicate: boolean // address already saved
  ready: boolean
}

// Normalize an address for comparison + storage (trim + lowercase).
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase()
}

// Validate a draft using the SAME recipient check the transfer path trusts, so
// the book can never store an address the wallet would reject. `existing` lets
// the caller flag duplicates (excluding the contact being edited).
export function validateContact(draft: ContactDraft, existing: Contact[] = [], editingId?: string): ContactValidation {
  const labelValid = draft.label.trim().length > 0
  const addrValid = isValidRecipient(draft.address)
  const norm = normalizeAddress(draft.address)
  const duplicate =
    addrValid && existing.some((c) => c.address === norm && c.id !== editingId)
  return { labelValid, addrValid, duplicate, ready: labelValid && addrValid && !duplicate }
}

// Build a contact from a validated draft. `id`/`now` injected for determinism.
export function createContact(draft: ContactDraft, id: string, nowIso: string): Contact {
  return {
    id,
    label: draft.label.trim(),
    address: normalizeAddress(draft.address),
    note: draft.note.trim(),
    createdAt: nowIso,
  }
}

// Add a saved recipient from a draft, deduping against existing addresses.
// Returns the new list, or null when the address is already saved (callers
// keep the book unchanged then). Pure — the view persists the result.
export function addContact(contacts: Contact[], draft: ContactDraft, id: string, nowIso: string): Contact[] | null {
  if (!validateContact(draft, contacts).ready) return null
  return [createContact(draft, id, nowIso), ...contacts]
}

// Apply an edit to an existing contact (immutably), re-normalizing the address.
export function applyEdit(contact: Contact, draft: ContactDraft): Contact {
  return {
    ...contact,
    label: draft.label.trim(),
    address: normalizeAddress(draft.address),
    note: draft.note.trim(),
  }
}

// Alphabetical by label (case-insensitive), stable for equal labels.
export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
}

// Case-insensitive search across label, note, and address.
export function searchContacts(contacts: Contact[], query: string): Contact[] {
  const q = query.trim().toLowerCase()
  if (!q) return contacts
  return contacts.filter(
    (c) => c.label.toLowerCase().includes(q) || c.note.toLowerCase().includes(q) || c.address.includes(q),
  )
}

// Find the saved contact for an address, if any (used to name a recipient in
// the transfer/activity views). Returns null when unknown.
export function contactFor(contacts: Contact[], address: string): Contact | null {
  const norm = normalizeAddress(address)
  return contacts.find((c) => c.address === norm) ?? null
}

// Deep link into the transfer flow pre-filled with this contact's address.
export function sendHref(contact: Contact): string {
  return `/transfer?to=${encodeURIComponent(contact.address)}`
}

// Display helper: short address for a contact.
export function shortFor(contact: Contact): string {
  return shortAddr(contact.address)
}

// ---- Relationship stats (derived from real on-chain activity) ----

// A contact's real interaction history with the connected wallet, computed
// from the same ArcScan tx feed the Activity view uses. Honest by construction:
// every number traces to a transaction the user can open on the explorer, and
// an unknown counterparty simply yields zeros (File 16). Pure + deterministic.
export interface ContactStats {
  txCount: number // transactions between the two wallets
  totalSent: number // USDC the user sent TO this contact
  totalReceived: number // USDC the user received FROM this contact
  lastTs: string | null // ISO of the most recent interaction, or null
}

export const EMPTY_STATS: ContactStats = { txCount: 0, totalSent: 0, totalReceived: 0, lastTs: null }

// Fold a wallet's transaction list into per-address relationship stats, keyed by
// lowercased counterparty address. One pass — the view looks each contact up.
export function statsByAddress(txs: ArcTx[]): Map<string, ContactStats> {
  const map = new Map<string, ContactStats>()
  for (const t of txs) {
    if (t.status === "error") continue
    // The counterparty is the OTHER side relative to the queried wallet.
    const other = t.direction === "out" ? t.to : t.from
    if (!other) continue
    const key = other.toLowerCase()
    const s = map.get(key) ?? { txCount: 0, totalSent: 0, totalReceived: 0, lastTs: null }
    s.txCount += 1
    if (t.direction === "out") s.totalSent += t.valueUSDC
    else if (t.direction === "in") s.totalReceived += t.valueUSDC
    if (t.timestamp && (s.lastTs === null || t.timestamp > s.lastTs)) s.lastTs = t.timestamp
    map.set(key, s)
  }
  return map
}

// Stats for a single contact from a prebuilt map (or empty when never seen).
export function statsFor(byAddress: Map<string, ContactStats>, contact: Contact): ContactStats {
  return byAddress.get(contact.address) ?? EMPTY_STATS
}

// Order contacts by real engagement: most interactions first, ties broken by
// most-recent contact, then alphabetically so the result is stable. Lets the
// book self-organize around who the user actually pays. Pure — no mutation.
export function rankByActivity(contacts: Contact[], byAddress: Map<string, ContactStats>): Contact[] {
  return [...contacts].sort((a, b) => {
    const sa = byAddress.get(a.address) ?? EMPTY_STATS
    const sb = byAddress.get(b.address) ?? EMPTY_STATS
    if (sb.txCount !== sa.txCount) return sb.txCount - sa.txCount
    const ta = sa.lastTs ?? ""
    const tb = sb.lastTs ?? ""
    if (tb !== ta) return tb < ta ? -1 : 1
    return a.label.toLowerCase().localeCompare(b.label.toLowerCase())
  })
}

// ---- Persistence (localStorage, per wallet) ----

const KEY_PREFIX = "aether.contacts."

export function storageKey(address: string): string {
  return `${KEY_PREFIX}${address.toLowerCase()}`
}

export function isContactsKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX)
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function coerce(raw: unknown): Contact[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (c): c is Contact =>
      !!c && typeof c === "object" &&
      typeof (c as Contact).id === "string" &&
      typeof (c as Contact).label === "string" &&
      typeof (c as Contact).address === "string",
  )
}

export function loadContacts(address: string): Contact[] {
  if (!isBrowser() || !address) return []
  try {
    const raw = window.localStorage.getItem(storageKey(address))
    if (!raw) return []
    return coerce(JSON.parse(raw))
  } catch (error) {
    console.error("Failed to load contacts", error)
    return []
  }
}

export function saveContacts(address: string, contacts: Contact[]): boolean {
  if (!isBrowser() || !address) return false
  try {
    window.localStorage.setItem(storageKey(address), JSON.stringify(contacts))
    return true
  } catch (error) {
    console.error("Failed to save contacts", error)
    return false
  }
}
