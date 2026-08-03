"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users, Plus, Send, Trash2, Pencil, X, Wallet, Search, Copy, Check,
} from "lucide-react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { shortAddr } from "@/lib/transfer"
import type { ArcTx } from "@/lib/arc"
import {
  validateContact, createContact, applyEdit, sortContacts, searchContacts,
  sendHref, loadContacts, saveContacts,
  statsByAddress, statsFor, rankByActivity,
  type Contact, type ContactDraft, type ContactStats,
} from "@/lib/contacts"

// Address Book — saved recipients for fast, safe transfers (File 02 core
// module). Selecting a contact deep-links into the transfer flow pre-filled
// with its address; the user still reviews and signs (File 16). Contacts live
// per wallet in localStorage via lib/contacts; all validation/dedup is there.

const EMPTY_DRAFT: ContactDraft = { label: "", address: "", note: "" }

export function ContactsView() {
  const { address, isConnected } = useAccount()
  const reduced = useReducedMotion()

  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [query, setQuery] = React.useState("")
  const [showForm, setShowForm] = React.useState(false)
  const [editing, setEditing] = React.useState<Contact | null>(null)
  const [sort, setSort] = React.useState<"name" | "activity">("name")
  // Live on-chain relationship stats, folded once from the ArcScan tx feed.
  const [byAddress, setByAddress] = React.useState<Map<string, ContactStats>>(new Map())

  React.useEffect(() => {
    if (address) setContacts(loadContacts(address))
    else setContacts([])
  }, [address])

  // Load activity so each card can show real sent/received/last-contact.
  React.useEffect(() => {
    if (!address) {
      setByAddress(new Map())
      return
    }
    let alive = true
    fetch(`/api/activity?address=${address}`)
      .then((r) => r.json())
      .catch(() => ({ items: [] }))
      .then((a) => {
        if (alive) setByAddress(statsByAddress((a.items as ArcTx[]) ?? []))
      })
    return () => {
      alive = false
    }
  }, [address])

  const persist = React.useCallback(
    (next: Contact[]) => {
      setContacts(next)
      if (address) saveContacts(address, next)
    },
    [address],
  )

  const save = React.useCallback(
    (draft: ContactDraft) => {
      if (editing) {
        persist(contacts.map((c) => (c.id === editing.id ? applyEdit(c, draft) : c)))
      } else {
        const id = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
        persist([createContact(draft, id, new Date().toISOString()), ...contacts])
      }
      setShowForm(false)
      setEditing(null)
    },
    [contacts, editing, persist],
  )

  const remove = (id: string) => persist(contacts.filter((c) => c.id !== id))
  const startEdit = (c: Contact) => {
    setEditing(c)
    setShowForm(true)
  }
  const startNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to open your address book">
        <p className="text-muted">Contacts live with your wallet, stored only on this device. You review and sign every payment yourself.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  // Search first, then order by the chosen mode: name (A–Z) or real activity
  // (most interactions / most recent first).
  const matched = searchContacts(contacts, query)
  const visible = sort === "activity" ? rankByActivity(matched, byAddress) : sortContacts(matched)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-primary" aria-hidden="true" /> Address Book
          </h2>
          <p className="mt-1 text-sm text-muted">
            Save recipients once, send in a tap. Contacts are stored only on this device — AetherFI never uploads them.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startNew}
            className="btn-glow shrink-0 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> Add contact</span>
          </button>
        )}
      </div>

      {showForm && (
        <ContactForm
          reduced={reduced}
          editing={editing}
          existing={contacts}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSave={save}
        />
      )}

      {/* Search — only when there's enough to filter */}
      {contacts.length > 3 && (
        <label className="glass flex items-center gap-2 px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            aria-label="Search contacts"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted/60"
          />
        </label>
      )}

      {/* Sort toggle — the book can self-organize around who you actually pay */}
      {contacts.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Sort</span>
          <div className="inline-flex overflow-hidden rounded-full border border-white/10">
            {(["name", "activity"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                aria-pressed={sort === mode}
                className={
                  "px-3 py-1 capitalize transition " +
                  (sort === mode ? "bg-primary/20 font-semibold text-foreground" : "hover:text-foreground")
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <EmptyState onCreate={startNew} />
      ) : visible.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-muted">No contacts match &ldquo;{query}&rdquo;.</div>
      ) : (
        <ul className="space-y-3">
          {visible.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              stats={statsFor(byAddress, c)}
              reduced={reduced}
              onEdit={() => startEdit(c)}
              onRemove={() => remove(c.id)}
            />
          ))}
        </ul>
      )}

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

function ContactCard({
  contact, stats, reduced, onEdit, onRemove,
}: { contact: Contact; stats: ContactStats; reduced: boolean; onEdit: () => void; onRemove: () => void }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — non-critical */
    }
  }
  // Real on-chain numbers (File 16): zeros mean no interactions yet, not
  // estimated figures.
  const lastSeen = stats.lastTs ? new Date(stats.lastTs).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "never"
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-sm font-bold uppercase text-foreground">
            {contact.label.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{contact.label}</div>
            <button onClick={copy} className="flex items-center gap-1.5 font-mono text-xs text-muted transition hover:text-foreground" aria-label="Copy address">
              {shortAddr(contact.address)}
              {copied ? <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
            </button>
            {contact.note && <div className="mt-0.5 truncate text-xs text-muted/70">{contact.note}</div>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={sendHref(contact)}
            className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send
          </Link>
          <IconBtn label="Edit contact" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </IconBtn>
          <IconBtn label="Delete contact" onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconBtn>
        </div>
      </div>

      {stats.txCount > 0 && (
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
          <Stat label="Sent" value={`${fmtUSDC(stats.totalSent)}`} unit="USDC" />
          <Stat label="Received" value={`${fmtUSDC(stats.totalReceived)}`} unit="USDC" />
          <Stat label="Last" value={lastSeen} unit={`${stats.txCount} tx`} />
        </dl>
      )}
    </motion.li>
  )
}

// Compact figure + label used in the contact stats strip.
function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted/60">{label}</div>
      <div className="truncate text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted/50">{unit}</div>
    </div>
  )
}

// Compact USDC formatting: up to 2 decimals, thousands grouped.
function fmtUSDC(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={"rounded-lg p-2 text-muted transition hover:bg-white/5 " + (danger ? "hover:text-red-400" : "hover:text-foreground")}
    >
      {children}
    </button>
  )
}

function ContactForm({
  reduced, editing, existing, onCancel, onSave,
}: {
  reduced: boolean; editing: Contact | null; existing: Contact[]
  onCancel: () => void; onSave: (d: ContactDraft) => void
}) {
  const [draft, setDraft] = React.useState<ContactDraft>(
    editing ? { label: editing.label, address: editing.address, note: editing.note } : EMPTY_DRAFT,
  )
  const v = validateContact(draft, existing, editing?.id)
  const set = (patch: Partial<ContactDraft>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass space-y-4 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{editing ? "Edit contact" : "New contact"}</div>
        <button onClick={onCancel} aria-label="Cancel" className="rounded-lg p-1.5 text-muted hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input
          value={draft.label}
          onChange={(e) => set({ label: e.target.value })}
          placeholder="Alice, landlord, exchange…"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Address</span>
        <input
          value={draft.address}
          onChange={(e) => set({ address: e.target.value })}
          placeholder="0x…"
          aria-invalid={draft.address.length > 0 && (!v.addrValid || v.duplicate)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
        />
        {draft.address.length > 0 && !v.addrValid && <span className="mt-1 block text-xs text-red-400">Enter a valid 0x address.</span>}
        {v.addrValid && v.duplicate && <span className="mt-1 block text-xs text-amber-400">This address is already saved.</span>}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Note <span className="text-muted/60">(optional)</span></span>
        <input
          value={draft.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="What's this address for?"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="rounded-full border border-white/10 px-5 py-2 text-sm text-muted transition hover:text-foreground">Cancel</button>
        <button
          onClick={() => v.ready && onSave(draft)}
          disabled={!v.ready}
          className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {editing ? "Save changes" : "Add contact"}
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass flex flex-col items-center gap-4 p-10 text-center">
      <div className="floaty text-primary"><Users className="h-10 w-10" aria-hidden="true" /></div>
      <div>
        <div className="text-lg font-semibold">No contacts yet</div>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Save the addresses you send to most — payroll, a friend, your exchange — and skip pasting 0x strings every time.
        </p>
      </div>
      <button onClick={onCreate} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white">
        <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> Add your first contact</span>
      </button>
    </div>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 pt-24 text-center">
      {Icon && <div className="floaty text-primary"><Icon className="h-12 w-12" aria-hidden="true" /></div>}
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}
