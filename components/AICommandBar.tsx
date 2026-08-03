"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2 } from "lucide-react"
import { parseEther, isAddress } from "viem"
import { useAccount, useSendTransaction, useChainId } from "wagmi"
import { arcTestnet } from "@/config/wagmi"

// A natural-language command bar. You type what you want in plain English and it
// turns simple money moves into a real Arc transaction that YOUR wallet signs.
// It only ever prepares the tx — the signature is always yours. This is the same
// idea the MCP server exposes to Claude/ChatGPT, just with a UI.

type Parsed =
  | { kind: "transfer"; to: `0x${string}`; amount: string }
  | { kind: "unknown"; reason: string }

function parseCommand(text: string): Parsed {
  const t = text.trim().toLowerCase()

  // send / transfer / pay <amount> [usdc] to <0x...>
  const m = t.match(/(?:send|transfer|pay)\s+([\d.]+)\s*(?:usdc)?\s+to\s+(0x[a-f0-9]{40})/i)
  if (m) {
    const amount = m[1]
    const to = m[2] as `0x${string}`
    if (!isAddress(to)) return { kind: "unknown", reason: "That address does not look valid." }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
      return { kind: "unknown", reason: "I could not read an amount to send." }
    return { kind: "transfer", to, amount }
  }

  if (/\b(swap|bridge)\b/.test(t))
    return {
      kind: "unknown",
      reason:
        "Swaps and bridges need a live pool on Arc Testnet. For now I can prepare direct USDC transfers you sign yourself.",
    }

  return {
    kind: "unknown",
    reason: 'Try something like: "send 0.5 USDC to 0xabc...".',
  }
}

export function AICommandBar() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id
  const [text, setText] = React.useState("")
  const [parsed, setParsed] = React.useState<Parsed | null>(null)
  const { sendTransaction, isPending, data: hash, error } = useSendTransaction()

  function preview() {
    if (!text.trim()) return
    setParsed(parseCommand(text))
  }

  function sign() {
    if (parsed?.kind !== "transfer") return
    sendTransaction({ to: parsed.to, value: parseEther(parsed.amount) })
  }

  if (!isConnected || !onArc) return null

  return (
    <div className="card-primary p-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wand2 className="h-5 w-5 text-champagne" aria-hidden="true" /> Command bar
        <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] text-silver-dim">you sign</span>
      </div>
      <p className="mb-4 text-xs text-silver">
        Tell it what to do in plain words. It prepares the transaction, your wallet signs it.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && preview()}
          placeholder="send 0.5 USDC to 0x..."
          aria-label="Natural-language command, for example: send 0.5 USDC to 0x address"
          className="flex-1 rounded-full border border-hairline bg-obsidian/40 px-5 py-3 text-sm text-foreground outline-none transition placeholder:text-silver-dim focus:border-champagne/40"
        />
        <button
          data-magnetic
          onClick={preview}
          className="btn-ghost px-6 py-3 text-sm font-semibold"
        >
          Preview
        </button>
      </div>

      <AnimatePresence mode="wait">
        {parsed && (
          <motion.div
            key={parsed.kind + (parsed.kind === "transfer" ? parsed.to + parsed.amount : parsed.reason)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
            className="mt-4"
          >
            {parsed.kind === "transfer" ? (
              <div className="rounded-xl border border-champagne/25 bg-champagne/[0.05] p-4">
                <div className="text-xs text-silver-dim">Ready to sign</div>
                <div className="mt-1 text-sm text-foreground">
                  Send <span className="font-semibold text-champagne">{parsed.amount} USDC</span> to{" "}
                  <span className="font-mono text-xs">
                    {parsed.to.slice(0, 8)}…{parsed.to.slice(-6)}
                  </span>
                </div>
                <button
                  data-magnetic
                  onClick={sign}
                  disabled={isPending}
                  className="btn-champagne mt-3 px-6 py-2.5 text-sm disabled:opacity-60"
                >
                  {isPending ? "Check your wallet…" : "Sign & send"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-hairline bg-obsidian/30 p-4 text-sm text-silver">
                {parsed.reason}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hash && (
        <div role="status" className="mt-3 text-xs text-champagne">
          Sent.{" "}
          <a
            href={`https://testnet.arcscan.app/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-champagne/40 underline-offset-4 hover:decoration-champagne"
          >
            View on ArcScan
          </a>
        </div>
      )}
      {error && (
        <div role="alert" className="mt-3 text-xs text-negative">
          {error.message.slice(0, 120)}
        </div>
      )}
    </div>
  )
}
