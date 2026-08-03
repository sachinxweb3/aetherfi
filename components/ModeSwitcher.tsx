"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock } from "lucide-react"
import { MODES, type ModeId, type ModeDef } from "@/lib/modes"
import { Icon } from "@/components/ui/icon"

// A compact popover to switch dashboard modes. Locked modes show a hint about
// how to unlock them instead of switching.
export function ModeSwitcher({
  mode,
  setMode,
  godUnlocked,
  arcUnlocked,
  legendUnlocked,
}: {
  mode: ModeId
  setMode: (m: ModeId) => void
  godUnlocked: boolean
  arcUnlocked: boolean
  legendUnlocked: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const active = MODES.find((m) => m.id === mode) ?? MODES[0]

  // Close the popover on Escape for keyboard users.
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function isUnlocked(m: ModeDef): boolean {
    if (m.unlock === "default") return true
    if (m.id === "god") return godUnlocked
    if (m.id === "arc") return arcUnlocked
    if (m.id === "legend") return legendUnlocked
    return false
  }

  function hint(m: ModeDef): string {
    if (m.id === "god") return "Enter the Konami code to unlock"
    if (m.id === "arc") return "Type the secret phrase (Arc team)"
    if (m.id === "legend") return "Reach a score of 800+ to unlock"
    return ""
  }

  return (
    <div className="relative">
      <button
        data-magnetic
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch dashboard view, current: ${active.label} Mode`}
        className="flex items-center gap-2 rounded-full border border-hairline bg-champagne/[0.03] px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-hairline-strong"
      >
        <Icon name={active.icon} className="h-4 w-4" />
        <span className="hidden sm:inline">{active.label} Mode</span>
        <span className="text-xs text-silver-dim" aria-hidden="true">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              role="menu"
              aria-label="Dashboard views"
              className="card-primary absolute right-0 z-50 mt-2 w-72 overflow-hidden p-2"
            >
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-silver-dim">
                Choose your view
              </div>
              {MODES.map((m) => {
                const unlocked = isUnlocked(m)
                const activeNow = m.id === mode
                return (
                  <button
                    key={m.id}
                    role="menuitem"
                    disabled={!unlocked}
                    onClick={() => {
                      if (unlocked) {
                        setMode(m.id)
                        setOpen(false)
                      }
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition ${
                      activeNow
                        ? "bg-champagne/[0.12]"
                        : unlocked
                          ? "hover:bg-champagne/[0.05]"
                          : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <Icon name={m.icon} className="h-5 w-5" />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {m.label}
                        {!unlocked && <Lock className="h-3 w-3 text-silver-dim" aria-label="Locked" />}
                        {activeNow && <span className="text-[10px] text-champagne">● active</span>}
                      </span>
                      <span className="block text-xs text-silver-dim">
                        {unlocked ? m.blurb : hint(m)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
