"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Command as CommandIcon, Send, ArrowRight } from "lucide-react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { filterActions, type PaletteAction } from "@/lib/palette"

// Global command palette (File 03 OS navigation). Opens on ⌘K / Ctrl+K from
// anywhere in the app; type to fuzzy-jump to any route, or type a transfer
// command ("send 5 to 0x…") to launch a pre-filled, user-signed transfer. Fully
// keyboard-driven (File 05 accessibility). Pure ranking lives in lib/palette.

export function CommandPalette() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const results = React.useMemo(() => filterActions(query), [query])

  // Global open shortcut + '/' quick-open when not already typing in a field.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (cmdK) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (e.key === "/" && !open) {
        const el = document.activeElement
        const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
        if (!typing) {
          e.preventDefault()
          setOpen(true)
        }
      }
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("af:palette", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("af:palette", onOpen)
    }
  }, [open])

  // Reset + focus each time the palette opens.
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setActive(0)
      // Focus after paint so the input exists.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Keep the active index in range as results change.
  React.useEffect(() => {
    setActive((i) => (i >= results.length ? 0 : i))
  }, [results.length])

  const run = React.useCallback(
    (action: PaletteAction | undefined) => {
      if (!action) return
      setOpen(false)
      router.push(action.href)
    },
    [router],
  )

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      run(results[active])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  // Scroll the active row into view on keyboard navigation.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [active])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-obsidian/70 p-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
          role="presentation"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-hairline-strong bg-graphite/95 shadow-2xl backdrop-blur"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Command palette"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-silver-dim" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="Search or type a command… (e.g. send 5 to 0x…)"
                aria-label="Search commands"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-silver-dim focus:outline-none"
              />
              <kbd className="hidden items-center gap-0.5 rounded border border-hairline px-1.5 py-0.5 text-[10px] text-silver-dim sm:flex">ESC</kbd>
            </div>

            {/* Results */}
            <ul ref={listRef} className="max-h-[50vh] overflow-y-auto py-2" role="listbox" aria-label="Commands">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-silver-dim">No matches for &ldquo;{query}&rdquo;</li>
              ) : (
                results.map((a, i) => {
                  const isActive = i === active
                  const transfer = a.kind === "transfer"
                  return (
                    <li key={a.id} data-idx={i} role="option" aria-selected={isActive}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => run(a)}
                        className={
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors " +
                          (isActive ? "bg-champagne/[0.08]" : "hover:bg-champagne/[0.04]")
                        }
                      >
                        <span className={"shrink-0 " + (transfer ? "text-positive" : "text-champagne")}>
                          {transfer ? <Send className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{a.label}</span>
                          {a.hint && <span className="block truncate text-xs text-silver-dim">{a.hint}</span>}
                        </span>
                        {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-silver-dim" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>

            {/* Footer hints */}
            <div className="flex items-center justify-between border-t border-hairline px-4 py-2 text-[11px] text-silver-dim">
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" aria-hidden="true" /><ArrowDown className="h-3 w-3" aria-hidden="true" /> navigate</span>
                <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" aria-hidden="true" /> open</span>
              </span>
              <span className="flex items-center gap-1">
                <CommandIcon className="h-3 w-3" aria-hidden="true" />K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
