"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli } from "@/lib/arc"
import { KundliDashboard } from "@/components/KundliDashboard"

export default function Home() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [data, setData] = React.useState<WalletKundli | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onArc = chainId === arcTestnet.id

  // Auto-prompt switch/add Arc network once connected on the wrong chain.
  React.useEffect(() => {
    if (isConnected && !onArc && switchChain) {
      switchChain({ chainId: arcTestnet.id })
    }
  }, [isConnected, onArc, switchChain])

  // Fetch kundli when connected + on Arc.
  React.useEffect(() => {
    if (!address || !isConnected) {
      setData(null)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    fetch(`/api/kundli?address=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.error) setError(d.error)
        else setData(d as WalletKundli)
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
  }, [address, isConnected])

  return (
    <div className="relative min-h-screen">
      <div className="aurora" />
      <div className="grid-overlay" />

      <div className="relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🔮</span> AetherFi
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {!isConnected ? (
            <Landing />
          ) : !onArc ? (
            <SwitchPrompt onSwitch={() => switchChain?.({ chainId: arcTestnet.id })} />
          ) : loading ? (
            <Loading />
          ) : error ? (
            <ErrorBox msg={error} />
          ) : data ? (
            <div className="pt-6">
              <KundliDashboard data={data} />
            </div>
          ) : null}
        </main>

        <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-muted">
          Built on{" "}
          <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="text-accent">
            Arc
          </a>{" "}
          Testnet · Data via ArcScan · Free forever
        </footer>
      </div>
    </div>
  )
}

function Landing() {
  return (
    <div className="flex flex-col items-center pt-16 text-center sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary">
          Live on Arc Public Testnet
        </div>
        <h1 className="text-5xl font-extrabold leading-tight sm:text-7xl">
          Your{" "}
          <span className="glow-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Arc Wallet Kundli
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted">
          Connect your wallet and reveal your on-chain identity — activity score, rank, badges, and an
          AI-powered personality. 100% free, no signup.
        </p>
        <div className="flex justify-center pt-2">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-base font-semibold text-white transition hover:scale-105"
              >
                Connect Wallet → Reveal My Kundli
              </button>
            )}
          </ConnectButton.Custom>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted">
          <span>⚡ Instant</span>
          <span>🔒 Read-only & safe</span>
          <span>🎯 Shareable card</span>
        </div>
      </motion.div>
    </div>
  )
}

function SwitchPrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 pt-24 text-center">
      <div className="text-5xl">🔗</div>
      <h2 className="text-2xl font-bold">Switch to Arc Testnet</h2>
      <p className="max-w-md text-muted">
        Your wallet is on the wrong network. Approve the prompt to add & switch to Arc Testnet
        automatically.
      </p>
      <button
        onClick={onSwitch}
        className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-white"
      >
        Switch to Arc
      </button>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex flex-col items-center gap-4 pt-32 text-center">
      <motion.div
        className="h-16 w-16 rounded-full border-4 border-white/10 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <div className="text-muted">Reading your onchain history…</div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
      <div className="text-2xl">⚠️</div>
      <div className="mt-2 font-semibold">{msg}</div>
      <div className="mt-1 text-sm text-muted">Please try again in a moment.</div>
    </div>
  )
}
