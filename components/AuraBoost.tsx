"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap } from "lucide-react"
import { parseEther } from "viem"
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { arcTestnet } from "@/config/wagmi"

// Aura Boost. Charge your aura with a tiny on-chain pulse. The boost is a real
// self-transfer of a dust amount, so it costs nothing but gas and never leaves
// your own wallet. Each mined boost lifts your streak, which is saved locally
// and read back to intensify the shader. Free, safe, and the wallet signs it.

const PULSE = "0.001" // USDC, sent to yourself

type Stage = "idle" | "signing" | "mining" | "done" | "error"

function keyFor(addr?: string) {
  return `af_boost_${(addr ?? "").toLowerCase()}`
}

export function readBoost(addr?: string): number {
  if (typeof window === "undefined") return 0
  const n = parseInt(window.localStorage.getItem(keyFor(addr)) ?? "0", 10)
  return Number.isFinite(n) ? n : 0
}

export function AuraBoost({ onBoost }: { onBoost?: (streak: number) => void }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id

  const [stage, setStage] = React.useState<Stage>("idle")
  const [streak, setStreak] = React.useState(0)
  const [note, setNote] = React.useState("")
  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = React.useState<`0x${string}` | undefined>()
  const { isSuccess: mined } = useWaitForTransactionReceipt({ hash })

  React.useEffect(() => {
    setStreak(readBoost(address))
  }, [address])

  React.useEffect(() => {
    if (!mined || stage !== "mining") return
    const next = readBoost(address) + 1
    window.localStorage.setItem(keyFor(address), String(next))
    setStreak(next)
    setStage("done")
    onBoost?.(next)
    const t = setTimeout(() => setStage("idle"), 2600)
    return () => clearTimeout(t)
  }, [mined, stage, address, onBoost])

  async function boost() {
    if (!address) return
    setNote("")
    setStage("signing")
    try {
      const tx = await sendTransactionAsync({ to: address, value: parseEther(PULSE) })
      setHash(tx)
      setStage("mining")
    } catch {
      setNote("Boost cancelled. Your aura holds steady.")
      setStage("error")
    }
  }

  if (!isConnected || !onArc) return null
  const busy = stage === "signing" || stage === "mining"

  return (
    <div className="card-primary relative overflow-hidden p-6">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Zap className="h-5 w-5 text-champagne" aria-hidden="true" /> Aura Boost
      </div>
      <p className="mb-4 text-xs text-silver">
        Charge your aura with a dust pulse to yourself. Costs only gas, never leaves your wallet.
        Every boost deepens your streak and intensifies the shader.
      </p>

      <div className="flex items-center gap-4">
        <button
          data-magnetic
          onClick={boost}
          disabled={busy}
          className="btn-champagne px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {stage === "signing" ? "Sign to boost…" : stage === "mining" ? "Charging…" : "Boost my Aura"}
        </button>
        <div className="flex items-baseline gap-1.5">
          <span className="champagne-sheen numeric text-2xl font-bold">{streak}</span>
          <span className="text-xs text-silver-dim">boost streak</span>
        </div>
      </div>

      <AnimatePresence>
        {stage === "done" && (
          <motion.div
            key="done"
            className="mt-3 text-xs font-semibold text-champagne"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✨ Aura charged. Streak now {streak}.
          </motion.div>
        )}
        {stage === "error" && note && (
          <motion.div
            key="err"
            className="mt-3 text-xs text-silver-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {note}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
