"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { KundliDashboard } from "@/components/KundliDashboard"
import { Assistant } from "@/components/Assistant"
import { Leaderboard } from "@/components/Leaderboard"
import { AuraCanvas } from "@/components/AuraCanvas"
import { MagneticCursor } from "@/components/MagneticCursor"
import { useKonami } from "@/hooks/useKonami"

export default function Home() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [data, setData] = React.useState<WalletKundli | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [intro, setIntro] = React.useState(true)

  const onArc = chainId === arcTestnet.id
  const godMode = useKonami()

  // Cinematic intro — dismiss after ignition, skippable.
  React.useEffect(() => {
    const t = setTimeout(() => setIntro(false), 2200)
    return () => clearTimeout(t)
  }, [])

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
        if (d.error) {
          setError(d.error)
        } else {
          const k = d as WalletKundli
          setData(k)
          fetch("/api/leaderboard", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              address: k.address,
              score: k.score,
              rank: k.rank,
              txCount: k.txCount,
            }),
          }).catch(() => {})
        }
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

  const base = auraParams(data)
  // Konami "god mode" supercharges the aura for fun.
  const params = godMode
    ? { energy: 1, density: 1, pulse: 1, rings: 1 }
    : base

  return (
    <div className="relative min-h-screen">
      {/* Signature WebGL aura — seeded by connected wallet, driven by stats */}
      <div className="aura-layer">
        <AuraCanvas address={address} params={params} className="h-full w-full" intense={godMode} />
      </div>
      {/* Legibility scrim over the shader */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(5,6,15,0.72)_100%)]" />
      <div className="grid-overlay" />

      <MagneticCursor />
      <CinematicIntro show={intro} onSkip={() => setIntro(false)} />
      <GodModeToast show={godMode} />

      <div className="relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <a href="#top" className="flex items-center gap-2 text-lg font-bold">
            <AuraMark /> <span className="grad-text">AetherFi</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#top" className="index-link transition hover:text-foreground">
              <span className="idx">01</span>Reveal
            </a>
            <a href="#leaderboard" className="index-link transition hover:text-foreground">
              <span className="idx">02</span>Leaderboard
            </a>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="index-link transition hover:text-foreground"
            >
              <span className="idx">03</span>Faucet
            </a>
          </nav>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </header>

        <main id="top" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {!isConnected ? (
            <Landing />
          ) : !onArc ? (
            <SwitchPrompt onSwitch={() => switchChain?.({ chainId: arcTestnet.id })} />
          ) : loading ? (
            <Loading />
          ) : error ? (
            <ErrorBox msg={error} />
          ) : data ? (
            <div className="space-y-6 pt-6">
              <KundliDashboard data={data} />
              <div id="leaderboard">
                <Leaderboard />
              </div>
            </div>
          ) : null}
        </main>

        <Assistant data={data} />

        <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-muted">
          Built on{" "}
          <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="text-accent">
            Arc
          </a>{" "}
          Testnet · Data via ArcScan · Free forever · No sign-up, no keys
        </footer>
      </div>
    </div>
  )
}

/* ---------- Cinematic intro overlay ---------- */
function CinematicIntro({ show, onSkip }: { show: boolean; onSkip: () => void }) {
  const word = "AETHERFI"
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={onSkip}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex">
              {word.split("").map((c, i) => (
                <motion.span
                  key={i}
                  className="grad-text text-4xl font-extrabold tracking-[0.2em] sm:text-6xl"
                  initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: "easeOut" }}
                >
                  {c}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="h-px w-40 bg-gradient-to-r from-transparent via-accent to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />
            <motion.div
              className="text-xs uppercase tracking-[0.3em] text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Your on-chain aura awaits
            </motion.div>
          </div>
          <div className="absolute bottom-8 text-[10px] uppercase tracking-widest text-muted/60">
            click to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Konami easter-egg toast */
function GodModeToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="btn-glow fixed left-1/2 top-6 z-[95] -translate-x-1/2 rounded-full border border-accent/40 bg-background/80 px-5 py-2.5 text-sm font-semibold backdrop-blur"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <span className="grad-text">✨ GOD MODE unlocked — aura supercharged</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Small animated logo mark */
function AuraMark() {
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-[6px] opacity-70" />
      <span className="relative h-3 w-3 rounded-full bg-gradient-to-br from-primary to-accent" />
    </span>
  )
}

function Landing() {
  return (
    <div className="flex flex-col items-center pt-16 text-center sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="max-w-3xl space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary backdrop-blur">
          <span className="floaty inline-block">◆</span> Live on Arc Public Testnet
        </div>
        <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-7xl">
          Every wallet has an{" "}
          <span className="grad-text glow-text">Aura</span>.
          <br />
          Reveal yours.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted">
          A living, generative identity forged from your real Arc activity — a one-of-a-kind
          aura, score, rank, badges & AI personality. Same wallet, same aura, forever.
          100% free, no sign-up.
        </p>
        <div className="flex justify-center pt-2">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                data-magnetic
                onClick={openConnectModal}
                className="btn-glow group relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-base font-semibold text-white transition hover:scale-105"
              >
                <span className="relative z-10">Connect & Reveal My Aura →</span>
              </button>
            )}
          </ConnectButton.Custom>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted">
          <span>⚡ Instant</span>
          <span>🔒 Read-only & safe</span>
          <span>🎨 Unique generative art</span>
          <span>🚀 Shareable</span>
        </div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="mt-16 text-xs uppercase tracking-[0.3em] text-muted/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        connect to begin
      </motion.div>
    </div>
  )
}

function SwitchPrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 pt-24 text-center">
      <div className="text-5xl floaty">🔗</div>
      <h2 className="text-2xl font-bold">Switch to Arc Testnet</h2>
      <p className="max-w-md text-muted">
        Your wallet is on the wrong network. Approve the prompt to add & switch to Arc Testnet
        automatically.
      </p>
      <button
        data-magnetic
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
      <div className="text-muted">Forging your aura from on-chain history…</div>
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
