"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, CheckCheck, X, CalendarClock, ArrowDownLeft, Wallet, TrendingUp, AlertTriangle } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { arcTestnet } from "@/config/wagmi"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { loadRules } from "@/lib/automation"
import {
  buildNotifications, resolve, unreadCount, markAllRead, dismiss, dismissAll,
  prune, loadState, saveState, EMPTY_STATE,
  type Notification, type NotifState, type NotifKind, type NotifTone,
} from "@/lib/notifications"

// Header notification bell + dropdown panel (File 03 OS surface). Alerts are
// derived from the same real facts the dashboard reads — due automations,
// failed/received transfers, funding, rank proximity — with read/dismissed
// state persisted per wallet. AETHER invents no events (File 16 honesty).

const KIND_ICON: Record<NotifKind, React.ComponentType<{ className?: string }>> = {
  automation: CalendarClock,
  transaction: ArrowDownLeft,
  funding: Wallet,
  rank: TrendingUp,
}

const TONE_COLOR: Record<NotifTone, string> = {
  caution: "text-caution",
  positive: "text-positive",
  neutral: "text-champagne",
}

export function NotificationBell() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [open, setOpen] = React.useState(false)
  const [notifs, setNotifs] = React.useState<Notification[]>([])
  const [state, setState] = React.useState<NotifState>(EMPTY_STATE)
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Derive notifications from live facts: kundli + activity (API) and the
  // wallet's own automation rules (localStorage). Refreshes on open and on a
  // slow tick so the badge stays honest without hammering the RPC.
  const refresh = React.useCallback(async () => {
    if (!address || !isConnected || !onArc) {
      setNotifs([])
      return
    }
    try {
      const [k, a] = await Promise.all([
        fetch(`/api/kundli?address=${address}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/activity?address=${address}`).then((r) => r.json()).catch(() => ({ items: [] })),
      ])
      const kundli = k && !k.error ? (k as WalletKundli) : null
      const txs = (a?.items as ArcTx[]) ?? []
      const rules = loadRules(address)
      const next = buildNotifications({ kundli, txs, rules })
      setNotifs(next)
      // Keep persisted state bounded to live facts.
      setState((s) => {
        const pruned = prune(s, next.map((n) => n.id))
        if (address) saveState(address, pruned)
        return pruned
      })
    } catch {
      /* transient — keep prior notifications */
    }
  }, [address, isConnected, onArc])

  // Load persisted read/dismissed state on wallet change, then derive.
  React.useEffect(() => {
    if (address) setState(loadState(address))
    else setState(EMPTY_STATE)
  }, [address])

  React.useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 60_000)
    return () => clearInterval(id)
  }, [refresh])

  // Close on outside click + Escape (File 05 keyboard access).
  React.useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const persist = React.useCallback(
    (next: NotifState) => {
      setState(next)
      if (address) saveState(address, next)
    },
    [address],
  )

  // Opening the panel marks everything visible as read.
  const toggle = () => {
    setOpen((o) => {
      const next = !o
      if (next) persist(markAllRead(notifs, state))
      return next
    })
  }

  if (!isConnected) return null

  const resolved = resolve(notifs, state)
  const unread = unreadCount(notifs, state)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-silver-dim transition-colors hover:bg-champagne/[0.06] hover:text-foreground"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[10px] font-bold text-obsidian">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-hairline-strong bg-graphite/95 shadow-2xl backdrop-blur sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell className="h-4 w-4 text-champagne" aria-hidden="true" /> Notifications
              </div>
              {resolved.length > 0 && (
                <button
                  onClick={() => persist(dismissAll(notifs, state))}
                  className="flex items-center gap-1 text-xs text-silver-dim transition hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Clear all
                </button>
              )}
            </div>

            <div className="max-h-[26rem] overflow-y-auto">
              {resolved.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-silver-dim">
                  <Bell className="h-6 w-6 opacity-40" aria-hidden="true" />
                  You&apos;re all caught up.
                </div>
              ) : (
                <ul className="divide-y divide-hairline">
                  {resolved.map((n) => {
                    const Icon = KIND_ICON[n.kind]
                    const body = (
                      <div className="flex items-start gap-3 px-4 py-3">
                        <span className={"mt-0.5 shrink-0 " + TONE_COLOR[n.tone]}>
                          {n.tone === "caution" ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span className="flex-1 text-sm font-medium leading-snug text-foreground">{n.title}</span>
                            {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" aria-label="Unread" />}
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-silver">{n.body}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            persist(dismiss(state, n.id))
                          }}
                          aria-label="Dismiss"
                          className="shrink-0 rounded-md p-1 text-silver-dim transition hover:bg-champagne/[0.06] hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )
                    return (
                      <li key={n.id} className="transition-colors hover:bg-champagne/[0.03]">
                        {n.href ? (
                          <Link href={n.href} onClick={() => setOpen(false)} className="block">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
