"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye } from "lucide-react"
import { parseEther } from "viem"
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { arcTestnet } from "@/config/wagmi"

// The Oracle, on the front end. Ask anything, pay a tiny Arc toll, get the answer.
// The toll is a real self-transfer of a dust amount so it costs nothing but gas
// and never leaves your own wallet. The server checks the receipt before it opens
// the answer, so the gate is genuine on-chain proof, not a fake timer.

const TOLL = "0.001" // USDC, sent to yourself

type Stage = "idle" | "signing" | "mining" | "answering" | "done" | "error"

export function Oracle() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id

  const [question, setQuestion] = React.useState("")
  const [stage, setStage] = React.useState<Stage>("idle")
  const [answer, setAnswer] = React.useState("")
  const [note, setNote] = React.useState("")
  const [source, setSource] = React.useState("")

  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = React.useState<`0x${string}` | undefined>()
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash })

  // Once the toll is mined, ask the server to verify + answer.
  React.useEffect(() => {
    if (!mined || !hash || stage !== "mining") return
    setStage("answering")
    fetch("/api/oracle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, txHash: hash, from: address }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setNote(d.error)
          setStage("error")
          return
        }
        setAnswer(d.answer ?? "")
        setSource(d.source ?? "")
        setStage("done")
      })
      .catch(() => {
        setNote("Something went wrong reaching the Oracle.")
        setStage("error")
      })
  }, [mined, hash, stage, question, address])

  async function ask() {
    const q = question.trim()
    if (!q || !address) return
    setAnswer("")
    setNote("")
    setStage("signing")
    try {
      const tx = await sendTransactionAsync({ to: address, value: parseEther(TOLL) })
      setHash(tx)
      setStage("mining")
    } catch {
      setNote("You dismissed the wallet. The Oracle stays sealed until the toll is paid.")
      setStage("error")
    }
  }

  function reset() {
    setStage("idle")
    setAnswer("")
    setNote("")
    setHash(undefined)
    setQuestion("")
  }

  if (!isConnected || !onArc) return null

  const busy = stage === "signing" || stage === "mining" || stage === "answering"

  return (
    <div className="glass relative overflow-hidden p-6">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Eye className="h-5 w-5 text-accent" aria-hidden="true" /> The Oracle
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
          pay-to-ask
        </span>
      </div>
      <p className="mb-4 text-xs text-muted">
        Ask anything, any subject on earth. The answer stays sealed until you pay a{" "}
        {TOLL} USDC toll on Arc. The toll goes to your own wallet, so it costs only gas, and the
        server checks the transaction really landed before it opens the answer.
      </p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={busy}
        rows={2}
        placeholder="e.g. I want to travel from Delhi to Manali, what route should I take?"
        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      />

      <div className="mt-3 flex items-center gap-3">
        {stage !== "done" ? (
          <button
            data-magnetic
            onClick={ask}
            disabled={busy || !question.trim()}
            className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {stage === "signing"
              ? "Confirm in wallet…"
              : stage === "mining"
                ? "Paying toll…"
                : stage === "answering"
                  ? "Unlocking…"
                  : `Pay ${TOLL} USDC & ask`}
          </button>
        ) : (
          <button
            data-magnetic
            onClick={reset}
            className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold transition hover:border-primary/40"
          >
            Ask another
          </button>
        )}
        {hash && (
          <a
            href={`https://testnet.arcscan.app/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted underline"
          >
            toll receipt
          </a>
        )}
      </div>

      <AnimatePresence>
        {(answer || note) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {answer ? (
              <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-accent">
                  Unlocked
                  {source === "local" && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">
                      demo
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{answer}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-muted">
                {note}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
