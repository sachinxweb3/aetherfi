"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { WalletKundli } from "@/lib/arc"

interface Msg {
  role: "user" | "assistant"
  text: string
}

export function Assistant({ data }: { data?: WalletKundli | null }) {
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { role: "assistant", text: "Hey, I'm Aura 🔮 — ask me anything about Arc, the faucet, or your score." },
  ])
  const [busy, setBusy] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    setMsgs((m) => [...m, { role: "user", text }])
    setBusy(true)
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: data
            ? {
                rank: data.rank,
                score: data.score,
                txCount: data.txCount,
                balanceUSDC: data.balanceUSDC,
                walletAgeDays: data.walletAgeDays,
              }
            : undefined,
        }),
      })
      const d = await res.json()
      setMsgs((m) => [...m, { role: "assistant", text: d.reply ?? "…" }])
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Hmm, I couldn't reach the server. Try again?" }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-glow fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-2xl shadow-lg"
        aria-label="Open Aura assistant"
      >
        {open ? "✕" : "🔮"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden"
          >
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">
              Aura · AetherFi Assistant
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-gradient-to-r from-primary to-accent text-white"
                      : "bg-white/5"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {busy && <div className="text-xs text-muted">Aura is thinking…</div>}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t border-white/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about Arc…"
                className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={send}
                disabled={busy}
                className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
