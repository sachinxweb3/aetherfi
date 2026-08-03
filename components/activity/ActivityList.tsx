"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Activity as ActivityIcon, ArrowDownLeft, ArrowUpRight, RefreshCw,
  Wallet, ExternalLink, AlertTriangle, Repeat2, UserPlus, Check,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { ArcTx } from "@/lib/arc"
import {
  relativeTime, methodLabel, signedAmount,
  filterActivity, filterCounts, groupByDay,
  type ActivityFilter, type ActivityDay,
} from "@/lib/activity"
import { shortAddr } from "@/lib/transfer"
import { loadContacts, saveContacts, contactFor, addContact, type Contact } from "@/lib/contacts"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, stagger } from "@/lib/motion"

// History — read-only transaction history for the connected wallet. Same free
// ArcScan v2 source that powers the aura; AETHER never writes here. A per-day
// timeline: filter by direction or status, each day rolled up to its net in and
// out so history reads as a narrative, not a flat log.

const EXPLORER = "https://testnet.arcscan.app"

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "In" },
  { key: "out", label: "Out" },
  { key: "failed", label: "Failed" },
]

const fmtUSDC = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 4 })

export function ActivityList() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [items, setItems] = React.useState<ArcTx[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<ActivityFilter>("all")
  const [contacts, setContacts] = React.useState<Contact[]>([])

  // Saved contacts resolve counterparty names (Address Book integration).
  React.useEffect(() => {
    if (address) setContacts(loadContacts(address))
    else setContacts([])
  }, [address])

  const load = React.useCallback(() => {
    if (!address || !isConnected || !onArc) {
      setItems(null)
      return () => {}
    }
    let alive = true
    setLoading(true)
    setError(null)
    fetch(`/api/activity?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.error) setError(d.error)
        else setItems((d.items as ArcTx[]) ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setError("Could not reach Arc network")
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [address, isConnected, onArc])

  React.useEffect(() => load(), [load])

  // Save an unknown counterparty as a contact right from its row (Address Book
  // reverse direction). Dedup is handled by addContact — already-saved rows
  // don't render the button at all.
  const saveCounterparty = React.useCallback(
    (addr: string) => {
      const id = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
      const next = addContact(
        contacts,
        { label: shortAddr(addr), address: addr, note: "" },
        id,
        new Date().toISOString(),
      )
      if (!next) return
      setContacts(next)
      if (address) saveContacts(address, next)
    },
    [contacts, address],
  )

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to see your history">
        <p className="text-silver">Your wallet is your login. This is a read-only view of your Arc history.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="AetherFI lives on Arc.">
        <p className="text-silver">Approve the prompt to switch to Arc Testnet.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-champagne px-7 py-3 text-sm">
          Switch to Arc
        </button>
      </Centered>
    )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div {...rise(reduced, 0.05)} className="flex items-end justify-between">
        <div>
          <p className="eyebrow">History</p>
          <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Everything you&apos;ve done.</h1>
          <p className="mt-3 text-sm text-silver">Your recent transactions on Arc Testnet. Read-only.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh activity"
          className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm text-silver-dim transition hover:border-hairline-strong hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} aria-hidden="true" /> Refresh
        </button>
      </motion.div>

      {/* Filter tabs with live badge counts */}
      {items && items.length > 0 && (
        <nav className="flex gap-1 overflow-x-auto" aria-label="Filter transactions">
          {FILTERS.map((f) => {
            const counts = filterCounts(items)
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition " +
                  (filter === f.key
                    ? "bg-champagne/[0.1] text-foreground"
                    : "text-silver-dim hover:bg-champagne/[0.04] hover:text-foreground")
                }
              >
                {f.label}
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] tabular-nums " + (filter === f.key ? "bg-champagne/[0.15] text-champagne" : "bg-hairline text-silver-dim")}>
                  {counts[f.key]}
                </span>
              </button>
            )
          })}
        </nav>
      )}

      {/* ── Timeline ── */}
      {loading && !items ? (
        <ListSkeleton />
      ) : error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-negative/30 bg-negative/[0.06] p-4 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : items && items.length === 0 ? (
        <Empty />
      ) : (
        <Timeline items={items} filter={filter} reduced={reduced} contacts={contacts} address={address} onSaveCounterparty={saveCounterparty} />
      )}

      <Link href="/dashboard" className="inline-block text-sm text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne">
        ← Back to dashboard
      </Link>
    </div>
  )
}

function Timeline({ items, filter, reduced, contacts, address, onSaveCounterparty }: {
  items: ArcTx[] | null; filter: ActivityFilter; reduced: boolean; contacts: Contact[]; address: string | undefined; onSaveCounterparty: (addr: string) => void
}) {
  const days = React.useMemo(() => groupByDay(filterActivity(items ?? [], filter)), [items, filter])

  if (days.length === 0)
    return (
      <div className="card-quiet flex flex-col items-center gap-2 p-8 text-center text-sm text-silver-dim">
        <ActivityIcon className="h-6 w-6 opacity-40" aria-hidden="true" />
        No {filter === "failed" ? "failed" : filter === "all" ? "" : filter} transactions to show.
      </div>
    )

  let idx = 0
  return (
    <div className="space-y-6">
      {days.map((day) => (
        <DayGroup key={day.key} day={day} reduced={reduced} contacts={contacts} address={address} onSaveCounterparty={onSaveCounterparty} startIndex={(idx += day.count) - day.count} />
      ))}
    </div>
  )
}

function DayGroup({ day, reduced, startIndex, contacts, address, onSaveCounterparty }: {
  day: ActivityDay; reduced: boolean; startIndex: number; contacts: Contact[]; address: string | undefined; onSaveCounterparty: (addr: string) => void
}) {
  return (
    <section aria-label={day.label}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-sm font-medium text-foreground">{day.label}</h3>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          {day.inUSDC > 0 && <span className="text-positive">+{fmtUSDC(day.inUSDC)}</span>}
          {day.outUSDC > 0 && <span className="text-silver">−{fmtUSDC(day.outUSDC)}</span>}
          <span className="text-silver-dim">{day.count} tx</span>
        </div>
      </div>
      <ul className="space-y-2">
        {day.txs.map((tx, i) => (
          <Row key={tx.hash || `${day.key}-${i}`} tx={tx} reduced={reduced} index={startIndex + i} contacts={contacts} address={address} onSaveCounterparty={onSaveCounterparty} />
        ))}
      </ul>
    </section>
  )
}

function Row({ tx, reduced, index, contacts, address, onSaveCounterparty }: {
  tx: ArcTx; reduced: boolean; index: number; contacts: Contact[]; address: string | undefined; onSaveCounterparty: (addr: string) => void
}) {
  const dir = tx.direction
  const Icon = dir === "in" ? ArrowDownLeft : dir === "out" ? ArrowUpRight : Repeat2
  const tone =
    tx.status === "error"
      ? "text-negative"
      : dir === "in"
        ? "text-positive"
        : dir === "out"
          ? "text-foreground"
          : "text-ice"
  const counterparty = dir === "out" ? tx.to : tx.from
  const known = counterparty ? contactFor(contacts, counterparty) : null
  const [saved, setSaved] = React.useState(false)
  // Offer "save" only for real counterparties the user hasn't saved yet.
  const canSave = !!counterparty && counterparty.toLowerCase() !== address?.toLowerCase() && !known && !saved
  return (
    <motion.li
      {...stagger(reduced, index, 0.03)}
      className="card-quiet flex items-center gap-4 p-4 transition-colors hover:border-hairline-strong"
    >
      <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne/[0.06] " + tone}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">{methodLabel(tx)}</span>
          {known && <span className="shrink-0 rounded-full border border-champagne/30 bg-champagne/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-champagne">{known.label}</span>}
          {tx.status === "error" && (
            <span className="rounded-full border border-negative/30 px-1.5 py-0.5 text-[10px] uppercase text-negative">Failed</span>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-xs text-silver-dim">
          {dir === "out" ? "to" : "from"} {counterparty ? shortAddr(counterparty) : "—"} · {relativeTime(tx.timestamp)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={"numeric font-semibold " + (dir === "in" ? "text-positive" : "text-foreground")}>
          {signedAmount(tx)}
        </div>
        {tx.hash && (
          <a
            href={`${EXPLORER}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-silver-dim underline decoration-hairline-strong underline-offset-2 transition hover:text-foreground hover:decoration-champagne"
          >
            Receipt <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {canSave && (
        <button
          type="button"
          onClick={() => {
            if (!counterparty) return
            onSaveCounterparty(counterparty)
            setSaved(true)
          }}
          aria-label="Save this address as a contact"
          title="Save as contact"
          className="shrink-0 rounded-lg border border-dashed border-hairline-strong p-2 text-silver-dim transition hover:border-champagne/40 hover:text-foreground"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {saved && (
        <span className="shrink-0 text-positive" title="Saved as contact">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </motion.li>
  )
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="card-quiet flex items-center gap-4 p-4">
          <span className="shimmer h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <span className="shimmer block h-3 w-32 rounded" />
            <span className="shimmer block h-3 w-48 rounded" />
          </div>
          <span className="shimmer h-4 w-20 rounded" />
        </li>
      ))}
    </ul>
  )
}

function Empty() {
  return (
    <div className="card-primary flex flex-col items-center gap-5 p-10 text-center">
      <ActivityIcon className="h-9 w-9 text-champagne/60" aria-hidden="true" />
      <div>
        <div className="display text-2xl text-ivory">Nothing here yet.</div>
        <p className="mt-2 text-sm text-silver">Make your first move on Arc and it shows up here.</p>
      </div>
      <div className="flex gap-3">
        <Link href="/transfer" className="btn-champagne px-6 py-2.5 text-sm">
          Send USDC
        </Link>
        <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="btn-ghost px-6 py-2.5 text-sm font-medium">
          Get test USDC
        </a>
      </div>
    </div>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow flex items-center gap-2">
        {Icon && <Icon className="h-3 w-3 text-champagne" aria-hidden="true" />} History
      </p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-5xl">{title}</h2>
      {children}
    </div>
  )
}
