"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, AlertTriangle } from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import type { WalletKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { KundliDashboard } from "@/components/KundliDashboard"
import { AICommandBar } from "@/components/AICommandBar"
import { Oracle } from "@/components/Oracle"
import { Leaderboard } from "@/components/Leaderboard"
import { AuraCanvas } from "@/components/AuraCanvas"
import { AuraBoundary } from "@/components/AuraBoundary"
import { MagneticCursor } from "@/components/MagneticCursor"
import { SiteFooter } from "@/components/SiteFooter"
import { ModeSwitcher } from "@/components/ModeSwitcher"
import { useModes } from "@/hooks/useModes"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { rise, riseIn, EASE } from "@/lib/motion"
import { Wordmark } from "@/components/Wordmark"

export default function Home() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [data, setData] = React.useState<WalletKundli | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [intro, setIntro] = React.useState(true)
  const reducedMotion = useReducedMotion()

  const onArc = chainId === arcTestnet.id
  const { mode, setMode, godUnlocked, arcUnlocked, legendUnlocked } = useModes(data?.score ?? 0)
  const godMode = mode === "god"

  // Cinematic intro — dismiss after ignition, skippable. Under reduced-motion
  // (File 05 / File 11) the animated reveal is skipped entirely: dismiss on the
  // next tick so nothing animates or gates entry.
  React.useEffect(() => {
    const t = setTimeout(() => setIntro(false), reducedMotion ? 0 : 2200)
    return () => clearTimeout(t)
  }, [reducedMotion])

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
        <AuraBoundary>
          <AuraCanvas address={address} params={params} className="h-full w-full" intense={godMode} />
        </AuraBoundary>
      </div>
      {/* Legibility scrim over the shader */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,11,0.78)_100%)]" />
      <div className="horizon" />

      <MagneticCursor />
      <CinematicIntro show={intro} onSkip={() => setIntro(false)} reduced={reducedMotion} />
      <GodModeToast show={godMode} />

      <div className="relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-6 sm:px-12">
          <a href="#top" className="flex items-center gap-3">
            <AuraMark /> <Wordmark className="display text-lg tracking-wide" />
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-9 text-[13px] text-silver-dim md:flex">
            <a href="#system" className="transition hover:text-foreground">
              The System
            </a>
            <a href="#score" className="transition hover:text-foreground">
              The Score
            </a>
            <a href="#ledger" className="transition hover:text-foreground">
              The Ledger
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {isConnected && onArc && (
              <Link
                href="/dashboard"
                className="hidden rounded-full border border-champagne/30 bg-champagne/[0.06] px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-champagne/50 hover:bg-champagne/[0.1] sm:inline-flex"
              >
                Open Dashboard →
              </Link>
            )}
            {isConnected && onArc && data && (
              <ModeSwitcher
                mode={mode}
                setMode={setMode}
                godUnlocked={godUnlocked}
                arcUnlocked={arcUnlocked}
                legendUnlocked={legendUnlocked}
              />
            )}
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
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
              <KundliDashboard data={data} mode={mode} />
              {(mode === "aura" || mode === "legend" || mode === "god") && <AICommandBar />}
              {(mode === "aura" || mode === "legend" || mode === "god") && <Oracle />}
              <div id="leaderboard">
                <Leaderboard />
              </div>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}

/* ---------- Cinematic intro overlay ---------- */
function CinematicIntro({
  show,
  onSkip,
  reduced,
}: {
  show: boolean
  onSkip: () => void
  reduced: boolean
}) {
  // The lockup, letter by letter: "Aether" in ivory, "FI" in champagne, one
  // seamless word. Each letter keeps its own brand color through the reveal.
  const word = [
    { c: "A", cls: "text-ivory" },
    { c: "e", cls: "text-ivory" },
    { c: "t", cls: "text-ivory" },
    { c: "h", cls: "text-ivory" },
    { c: "e", cls: "text-ivory" },
    { c: "r", cls: "text-ivory" },
    { c: "F", cls: "text-champagne" },
    { c: "I", cls: "text-champagne" },
  ] as const
  // Reduced-motion: no stagger, no blur, no drift — everything renders settled.
  const spanInitial = reduced
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y: 22, filter: "blur(10px)" }
  const fadeInitial = reduced ? { opacity: 1 } : { opacity: 0 }
  const lineInitial = reduced ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }

  // Keyboard users must be able to dismiss the overlay too (it's a mouse-only
  // click target otherwise). Escape skips it while it's showing. File 11.
  React.useEffect(() => {
    if (!show) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSkip()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [show, onSkip])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-obsidian"
          initial={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(14px)" }}
          transition={{ duration: reduced ? 0 : 1, ease: EASE }}
          onClick={onSkip}
          role="dialog"
          aria-label="Intro — AetherFI"
        >
          <div className="flex flex-col items-center gap-7" aria-hidden="true">
            <div className="flex overflow-hidden">
              {word.map((l, i) => (
                <motion.span
                  key={i}
                  className={`display text-5xl tracking-[0.14em] sm:text-8xl ${l.cls}`}
                  initial={spanInitial}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { delay: 0.15 + i * 0.09, duration: 0.7, ease: EASE }
                  }
                >
                  {l.c}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="h-px w-24 bg-gradient-to-r from-transparent via-champagne to-transparent"
              initial={lineInitial}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={reduced ? { duration: 0 } : { delay: 0.9, duration: 0.8 }}
            />
            <motion.div
              className="eyebrow"
              initial={fadeInitial}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { delay: 1.3 }}
            >
              Financial Intelligence
            </motion.div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="absolute bottom-8 text-[10px] uppercase tracking-widest text-silver/50 transition hover:text-foreground"
          >
            Skip
          </button>
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
          className="fixed left-1/2 top-6 z-[95] -translate-x-1/2 rounded-full border border-champagne/40 bg-obsidian/85 px-5 py-2.5 text-sm font-semibold backdrop-blur"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <span className="champagne-sheen inline-flex items-center gap-1.5">◆ God mode — aura supercharged</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* AetherFI mark — a hairline champagne ring around a still point. Quiet, engraved. */
function AuraMark() {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center">
      <span className="spin-slow absolute inset-0 rounded-full border border-champagne/30" />
      <span className="absolute inset-1.5 rounded-full border border-champagne/15" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-champagne" />
    </span>
  )
}

function Landing() {
  const reduced = useReducedMotion()

  return (
    <section id="system" className="relative">
      {/* ── The first screen. One statement, set in editorial serif, left-aligned
          like the opening page of a book rather than a centered SaaS hero. ── */}
      <div className="flex min-h-[86vh] flex-col justify-center">
        <motion.p {...rise(reduced, 0.1)} className="eyebrow mb-8 flex items-center gap-3">
          <span className="h-px w-8 bg-champagne/50" /> Live on Arc · Self-custodied
        </motion.p>

        <h1 className="display max-w-[15ch] text-[3.4rem] leading-[0.92] text-ivory sm:text-[6.2rem]">
          <motion.span {...rise(reduced, 0.18)} className="block">
            Your wallet
          </motion.span>
          <motion.span {...rise(reduced, 0.32)} className="block">
            is a record
          </motion.span>
          <motion.span {...rise(reduced, 0.46)} className="block italic text-champagne">
            of a life.
          </motion.span>
        </h1>

        <motion.div {...rise(reduced, 0.7)} className="mt-10 flex max-w-2xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-lg leading-relaxed text-silver">
            AetherFI reads it back to you as intelligence. A score, a story, one calm place to move
            your money. It never holds your keys.
          </p>

          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                data-magnetic
                onClick={openConnectModal}
                className="btn-champagne group inline-flex shrink-0 items-center gap-2 px-7 py-3.5 text-[15px]"
              >
                Reveal my wallet
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
            )}
          </ConnectButton.Custom>
        </motion.div>

        {/* Ledger footnote — three facts, hairline-separated, no icons, no pills */}
        <motion.dl {...rise(reduced, 0.9)} className="mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-graphite">
          {[
            ["No sign-up", "Your wallet is the login"],
            ["Read-only", "We never sign for you"],
            ["Free forever", "No email, no password"],
          ].map(([t, d]) => (
            <div key={t} className="bg-obsidian/60 p-5">
              <dt className="text-sm font-medium text-foreground">{t}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-silver-dim">{d}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* Quiet scroll cue — a single descending hairline */}
      <motion.div
        aria-hidden="true"
        className="mx-auto mt-4 h-16 w-px bg-gradient-to-b from-champagne/30 to-transparent"
        animate={reduced ? { opacity: 0.5 } : { opacity: [0.15, 0.6, 0.15] }}
        transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
      <span className="sr-only">Scroll</span>

      {/* ── The Score — the product's core artifact, demonstrated. A single
          number, counted up on scroll, set beside the claim it earns. This is
          the landing showing rather than telling. ── */}
      <ScoreReveal reduced={reduced} />

      {/* ── Act II · The Ledger — three chapters, told like a keynote. Not a
          feature grid: each chapter is one idea set in display type. ── */}
      <section id="ledger" className="mt-32 border-t border-hairline pt-20 sm:mt-44 sm:pt-28">
        <div className="space-y-24 sm:space-y-36">
          {[
            {
              n: "01",
              title: ["It reads", "your history."],
              body: "Every transfer is a sentence. AetherFI reads the whole story. What you send, to whom, how steadily. Then it answers the question no dashboard asks: what kind of steward are you?",
            },
            {
              n: "02",
              title: ["It shows you", "what you are."],
              body: "One intelligence score, forged from your real ledger. Your rank on Arc, your badges, the habits worth keeping and the leaks worth plugging. No estimates. No guesses.",
            },
            {
              n: "03",
              title: ["It moves money", "when you say so."],
              body: "One calm surface for transfers, automation, and your address book. AetherFI prepares everything. You review and sign every payment. The keys never leave your wallet.",
            },
          ].map((ch, i) => (
            <motion.div
              key={ch.n}
              {...riseIn(reduced)}
              className="grid gap-6 sm:grid-cols-12 sm:gap-8"
            >
              <div className="sm:col-span-3">
                <span className="display text-5xl text-champagne/25">{ch.n}</span>
              </div>
              <div className="sm:col-span-6">
                <h3 className="display text-3xl leading-[1.02] text-ivory sm:text-5xl">
                  {ch.title.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </h3>
                <p className="mt-6 max-w-md leading-relaxed text-silver">{ch.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Closing statement + CTA — the last word before the connection */}
        <motion.div
          {...riseIn(reduced)}
          className="mt-32 flex flex-col items-start gap-8 sm:mt-44"
        >
          <p className="eyebrow">The first Financial Intelligence OS</p>
          <p className="display max-w-[12ch] text-4xl leading-[0.95] text-ivory sm:text-7xl">
            Your ledger has a <span className="italic text-champagne">story</span>.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                data-magnetic
                onClick={openConnectModal}
                className="btn-champagne group inline-flex shrink-0 items-center gap-2 px-8 py-4 text-[15px]"
              >
                Begin the read
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
            )}
          </ConnectButton.Custom>
        </motion.div>
      </section>
    </section>
  )
}

/* ── The Score — the landing's signature artifact. A 1000-point dial,
   counted up on scroll, showing the product instead of describing it.
   Mirrors the dashboard gauge in the same champagne language. ── */
function ScoreReveal({ reduced }: { reduced: boolean }) {
  const target = 742
  const [n, setN] = React.useState(0)
  const dialRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const el = dialRef.current
    if (!el) return
    if (reduced) {
      setN(target)
      return
    }
    let raf = 0
    let started = false
    const run = () => {
      if (started) return
      started = true
      const t0 = performance.now()
      const dur = 1600
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur)
        const eased = 1 - Math.pow(1 - p, 3)
        setN(Math.round(target * eased))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          obs.disconnect()
        }
      },
      { rootMargin: "-120px" },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  const RAD = 64
  const SWEEP = Math.PI * 1.5 // 270°, matching the dashboard gauge
  const END = Math.PI * 0.25
  const x = (a: number) => 90 + RAD * Math.cos(a)
  const y = (a: number) => 90 - RAD * Math.sin(a)

  return (
    <section id="score" className="mt-36 border-t border-hairline pt-24 sm:mt-48 sm:pt-32">
      <motion.div
        {...riseIn(reduced)}
        className="grid items-center gap-12 sm:grid-cols-2"
      >
        <div>
          <p className="eyebrow">The intelligence score</p>
          <h3 className="display mt-5 max-w-[14ch] text-4xl leading-[0.98] text-ivory sm:text-6xl">
            One number, read from <span className="italic text-champagne">your ledger</span>.
          </h3>
          <p className="mt-6 max-w-md leading-relaxed text-silver">
            AetherFI weighs what you send, how steadily, and to whom. Then it renders one score out
            of 1000. No estimates. No guesses. Only what your history already says.
          </p>
        </div>

        {/* The dial — counted up as it enters view */}
        <div ref={dialRef} className="relative mx-auto flex h-52 w-52 items-center justify-center">
          <svg width={180} height={180} viewBox="0 0 180 180" className="absolute inset-0" aria-hidden="true">
            {/* Track */}
            <path
              d={`M ${x(END)} ${y(END)} A ${RAD} ${RAD} 0 0 1 ${x(SWEEP + END)} ${y(SWEEP + END)}`}
              fill="none"
              stroke="rgba(238,232,216,0.07)"
              strokeWidth={6}
              strokeLinecap="round"
            />
            {/* Value arc — the fill of the score */}
            <motion.path
              d={`M ${x(END)} ${y(END)} A ${RAD} ${RAD} 0 0 1 ${x(SWEEP + END)} ${y(SWEEP + END)}`}
              fill="none"
              stroke="url(#landingGauge)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="301.6 301.6"
              initial={reduced ? { strokeDashoffset: 0 } : { strokeDashoffset: 301.6 }}
              whileInView={{ strokeDashoffset: 301.6 * (1 - target / 1000) }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: reduced ? 0 : 1.6, ease: EASE }}
              style={{ filter: "drop-shadow(0 0 6px rgba(216,192,138,0.3))" }}
            />
            <defs>
              <linearGradient id="landingGauge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b8975a" />
                <stop offset="55%" stopColor="#d8c08a" />
                <stop offset="100%" stopColor="#9fc1d6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative flex flex-col items-center">
            <span className="display text-6xl leading-none text-ivory">{n}</span>
            <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-silver-dim">of 1000</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function SwitchPrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-start justify-center gap-6">
      <p className="eyebrow">Wrong network</p>
      <h2 className="display max-w-[16ch] text-4xl leading-tight text-ivory sm:text-6xl">
        AetherFI lives on <span className="italic text-champagne">Arc</span>.
      </h2>
      <p className="max-w-md text-silver">
        Your wallet is connected to another chain. Approve the prompt to add and switch to Arc
        Testnet — it takes a second.
      </p>
      <button data-magnetic onClick={onSwitch} className="btn-champagne px-7 py-3.5 text-[15px]">
        Switch to Arc
      </button>
    </div>
  )
}

function Loading() {
  const reduced = useReducedMotion()
  return (
    <div className="flex min-h-[70vh] flex-col items-start justify-center gap-6" role="status">
      <p className="eyebrow">Reading the ledger</p>
      <div className="flex items-baseline gap-4">
        <span className="display text-4xl text-ivory sm:text-6xl">Composing</span>
        {!reduced && (
          <motion.span
            className="flex gap-1.5"
            aria-hidden="true"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="mb-1 h-1.5 w-1.5 rounded-full bg-champagne"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              />
            ))}
          </motion.span>
        )}
      </div>
      <p className="text-silver">Turning your on-chain history into intelligence.</p>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex min-h-[70vh] flex-col items-start justify-center gap-4">
      <div className="flex items-center gap-2 text-negative">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span className="eyebrow text-negative">Interrupted</span>
      </div>
      <h2 className="display text-3xl text-ivory sm:text-5xl">{msg}</h2>
      <p className="text-silver">Give it a moment and try again.</p>
    </div>
  )
}
