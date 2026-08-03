"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Sparkles, Wallet, Send, CalendarClock, Users, Repeat, Waypoints,
  Activity, BarChart3, Bot, ShieldCheck, Code2, Settings, PanelLeft, X, ChevronLeft, Search,
} from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/shell/NotificationBell"
import { CommandPalette } from "@/components/shell/CommandPalette"
import { Wordmark } from "@/components/Wordmark"

// Persistent AETHER app shell: collapsible, keyboard-accessible sidebar (File 03)
// + top bar, wrapping every /(app) route. Nav is grouped into quiet sections so
// the surface reads as an operating system, not a flat menu. Unbuilt routes
// render as honest disabled "Soon" entries — never a fabricated feature (07/16).

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean }
type Group = { label: string; items: Item[] }

const GROUPS: Group[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/", label: "Your aura", icon: Sparkles },
      { href: "/analytics", label: "Understand", icon: BarChart3 },
      { href: "/activity", label: "History", icon: Activity },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/portfolio", label: "Everything you own", icon: Wallet },
      { href: "/transfer", label: "Send", icon: Send },
      { href: "/automation", label: "Automate", icon: CalendarClock },
      { href: "/contacts", label: "People", icon: Users },
      { href: "/swap", label: "Swap", icon: Repeat, soon: true },
      { href: "/bridge", label: "Bridge", icon: Waypoints, soon: true },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/assistant", label: "Assistant", icon: Bot },
      { href: "/security", label: "Security", icon: ShieldCheck },
      { href: "/developer", label: "Developer", icon: Code2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

const NAV: Item[] = GROUPS.flatMap((g) => g.items)

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-6">
      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <span className="spin-slow absolute inset-0 rounded-full border border-champagne/30" />
        <span className="absolute inset-1.5 rounded-full border border-champagne/15" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-champagne" />
      </span>
      {!collapsed && <Wordmark className="display text-base tracking-wide" />}
    </Link>
  )
}

function NavLinks({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          {!collapsed && (
            <div className="eyebrow px-3 pb-1.5 !text-[10px]">{group.label}</div>
          )}
          {group.items.map((it) => {
            const active = pathname === it.href
            const Icon = it.icon
            if (it.soon) {
              return (
                <span
                  key={it.href}
                  aria-disabled="true"
                  title="Coming soon"
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-silver-dim", collapsed && "justify-center")}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{it.label}</span>
                      <span className="text-[9px] uppercase tracking-wide text-silver-dim">Soon</span>
                    </>
                  )}
                </span>
              )
            }
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "text-foreground" : "text-silver hover:text-foreground",
                  collapsed && "justify-center"
                )}
              >
                {/* active marker — a champagne hairline, not a filled block */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-champagne" aria-hidden="true" />
                )}
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-champagne")} />
                {!collapsed && <span className="truncate">{it.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

const TITLES: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.href, n.label]))

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close the mobile drawer on navigation and on Escape (File 11 keyboard access).
  React.useEffect(() => setMobileOpen(false), [pathname])
  React.useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  const title = TITLES[pathname] ?? "AetherFI"

  return (
    <div className="relative min-h-screen">
      <div className="horizon" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-hairline bg-graphite/60 backdrop-blur-xl transition-[width] md:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <Brand collapsed={collapsed} />
        <NavLinks pathname={pathname} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="m-3 flex items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-xs text-silver-dim transition-colors hover:border-hairline-strong hover:text-foreground"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-obsidian/70 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-graphite md:hidden" role="dialog" aria-label="Navigation menu">
            <div className="flex items-center justify-between pr-2">
              <Brand collapsed={false} />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-silver-dim hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} collapsed={false} />
          </aside>
        </>
      )}

      {/* Content column */}
      <div className={cn("relative z-10 flex min-h-screen flex-col transition-[padding] md:pl-64", collapsed && "md:pl-[72px]")}>
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-obsidian/60 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-silver-dim hover:text-foreground md:hidden"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium tracking-wide text-foreground">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("af:palette"))}
              aria-label="Open command palette"
              className="hidden items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-xs text-silver-dim transition-colors hover:border-hairline-strong hover:text-foreground sm:flex"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Search</span>
              <kbd className="rounded border border-hairline px-1 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <NotificationBell />
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </header>
        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">{children}</main>
      </div>

      <CommandPalette />
    </div>
  )
}
