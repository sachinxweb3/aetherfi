"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowUpRight, CornerDownLeft, Send, Wallet } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli, ArcTx } from "@/lib/arc"
import { resolveTurn, type ChatTurn } from "@/lib/chat"
import { loadContacts, type Contact } from "@/lib/contacts"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// The AI surface, as a focused conversation (Phase A). Not a corner drawer and
// not a robot chatbot: a calm, page-wide reading room in the AETHER language.
// Instant deterministic answers over live wallet data; open Arc / how-to
// questions defer to /api/assistant. History persists per session.

const STORAGE_KEY = "aether.chat.v1"

const PROMPTS = [
  "What's my balance?",
  "How much have I spent lately?",
  "Why is my score that number?",
  "Who do I send to most?",
  "How do I get testnet USDC?",
  "What is Arc?",
]

export default function AssistantPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id

  const [data, setData] = React.useState<WalletKundli | null>(null)
  const [txs, setTxs] = React.useState<ArcTx[]>([])
  const [turns, setTurns] = React.useState<ChatTurn[]>([])
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const endRef = React.useRef<HTMLDivElement>(null)

  // Saved contacts resolve "send 5 to Alice" and named confirm cards.
  React.useEffect(() => {
    if (address) setContacts(loadContacts(address))
    else setContacts([])
  }, [address])

  // Restore history once on mount.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setTurns(JSON.parse(raw) as ChatTurn[])
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  // Persist on every change.
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-50)))
    } catch {
      /* quota — ignore */
    }
  }, [turns])

  // Fetch wallet data so local intents can answer.
  React.useEffect(() => {
    if (!address || !isConnected || !onArc) {
      setData(null)
      setTxs([])
      return
    }
    let alive = true
    Promise.all([
      fetch(`/api/kundli?address=${address}`).then((r) => r.json()),
      fetch(`/api/activity?address=${address}`).then((r) => r.json()).catch(() => ({ items: [] })),
    ]).then(([k, a]) => {
      if (!alive) return
      if (!k.error) {
        setData(k as WalletKundli)
        setTxs((a.items as ArcTx[]) ?? [])
      }
    })
    return () => {
      alive = false
    }
  }, [address, isConnected, onArc])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns, busy])

  const send = async (raw: string) => {
    const q = raw.trim()
    if (!q || busy) return
    setInput("")
    setTurns((t) => [...t, { role: "user", text: q, source: "local" }])
    if (!data) {
      setTurns((t) => [...t, { role: "aether", text: "Connect your wallet on Arc and I can read your data to answer.", source: "local" }])
      return
    }
    setBusy(true)
    // Thread the most recent aether turn's resolved intent so short follow-ups
    // ("and received?", "why?") answer in context.
    const prevIntent = [...turns].reverse().find((t) => t.role === "aether")?.intent ?? null
    const turn = await resolveTurn(data, txs, q, undefined, prevIntent, contacts)
    setTurns((t) => [...t, turn])
    setBusy(false)
  }

  if (!isConnected) return <Gate title="Your wallet is the login." body="AetherFI reads your Arc history to answer. It stays read-only and never signs for you." connect />
  if (!onArc) return <Gate title="AetherFI lives on Arc." body="Switch to Arc Testnet and I can answer over your activity." />

  const started = turns.length > 0

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-2xl flex-col">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-champagne" aria-hidden="true" /> The companion
          </p>
          <h1 className="display mt-2 text-3xl leading-none text-ivory sm:text-4xl">Ask your wallet anything.</h1>
        </div>
        {started && (
          <button
            onClick={() => setTurns([])}
            className="shrink-0 text-xs text-silver-dim underline decoration-hairline-strong underline-offset-4 transition hover:text-foreground hover:decoration-champagne"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {!started ? (
            <Empty onPick={send} />
          ) : (
            turns.map((t, i) => <Turn key={i} turn={t} />)
          )}
          {busy && <Thinking />}
          <div ref={endRef} />
        </div>
        <Composer input={input} setInput={setInput} onSend={() => send(input)} busy={busy} />
      </div>
    </div>
  )
}

/* One exchange. The person's words sit right, quiet and boxed; AETHER answers
   left as flowing text under a single champagne mark. No avatars, no bubbles
   fighting for attention. */
function Turn({ turn }: { turn: ChatTurn }) {
  const reduced = useReducedMotion()
  const user = turn.role === "user"

  if (user) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end"
      >
        <p className="max-w-[85%] rounded-2xl border border-hairline bg-obsidian/40 px-4 py-2.5 text-sm text-foreground">
          {turn.text}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3"
    >
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{turn.text}</p>

        {turn.command && (
          <Link
            href={turn.command.href}
            className="mt-3 inline-flex items-center gap-2.5 rounded-xl border border-champagne/30 bg-champagne/[0.06] px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:border-champagne/50 hover:bg-champagne/[0.1]"
          >
            {turn.command.kind === "transfer" ? <Send className="h-4 w-4 text-champagne" aria-hidden="true" /> : <Wallet className="h-4 w-4 text-champagne" aria-hidden="true" />}
            <span>{turn.command.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-champagne" aria-hidden="true" />
          </Link>
        )}
        {turn.href && !turn.command && (
          <Link href={turn.href} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-champagne underline decoration-champagne/40 underline-offset-4 transition hover:decoration-champagne">
            Open details <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}

function Thinking() {
  return (
    <div className="flex items-center gap-3" role="status">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" aria-hidden="true" />
      <span className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-silver-dim" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
      <span className="text-xs text-silver-dim">Reading your ledger</span>
    </div>
  )
}

function Empty({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-center gap-8 py-6">
      <p className="max-w-md text-lg leading-relaxed text-silver">
        Your balance, spending, score, streak. Answered from live data as you ask. Or ask about Arc and how anything works.
      </p>
      <div className="flex flex-col gap-2">
        <p className="eyebrow !text-[10px]">Try</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => onPick(p)}
              className="rounded-full border border-hairline px-3.5 py-1.5 text-xs text-silver transition-colors hover:border-hairline-strong hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Composer({
  input, setInput, onSend, busy,
}: { input: string; setInput: (v: string) => void; onSend: () => void; busy: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSend()
      }}
      className="mt-5 flex items-center gap-2 border-t border-hairline pt-5"
    >
      <div className="relative flex-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your wallet, Arc, or how anything works…"
          aria-label="Message AetherFI"
          className="w-full rounded-full border border-hairline bg-obsidian/40 py-3 pl-5 pr-10 text-sm text-foreground outline-none transition placeholder:text-silver-dim focus:border-champagne/40"
        />
        <CornerDownLeft className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-dim" aria-hidden="true" />
      </div>
      <button
        type="submit"
        disabled={!input.trim() || busy}
        className="btn-champagne shrink-0 px-6 py-3 text-sm disabled:opacity-50"
      >
        Ask
      </button>
    </form>
  )
}

function Gate({ title, body, connect }: { title: string; body: string; connect?: boolean }) {
  return (
    <div className="flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-6">
      <p className="eyebrow">The companion</p>
      <h2 className="display text-4xl leading-tight text-ivory sm:text-6xl">{title}</h2>
      <p className="max-w-md text-silver">{body}</p>
      {connect && <ConnectButton showBalance={false} chainStatus="icon" />}
    </div>
  )
}
