"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import type { WalletKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { AuraCanvas } from "@/components/AuraCanvas"
import { Reveal, Tilt } from "@/components/Motion"

/* ---------- Count-up number ---------- */
function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  )
  React.useEffect(() => {
    const controls = animate(mv, value, { duration: 1.4, ease: "easeOut" })
    return controls.stop
  }, [value, mv])
  return (
    <span>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

/* ---------- Score ring ---------- */
function ScoreRing({ score, rank }: { score: number; rank: string }) {
  const pct = Math.min(1, score / 1000)
  const R = 84
  const C = 2 * Math.PI * R
  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <motion.circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#g)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - C * pct }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="text-4xl font-extrabold glow-text">
          <CountUp value={score} />
        </div>
        <div className="text-xs text-muted">/ 1000</div>
        <div className="mt-1 text-sm font-semibold text-accent">{rank}</div>
      </div>
    </div>
  )
}

/* ---------- Stat card ---------- */
function Stat({
  label,
  value,
  decimals,
  suffix,
  delay,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
  delay: number
}) {
  return (
    <Tilt>
      <motion.div
        className="glass holo p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
        <div className="mt-2 text-2xl font-bold">
          <CountUp value={value} decimals={decimals} suffix={suffix} />
        </div>
      </motion.div>
    </Tilt>
  )
}

/* ---------- Activity waveform ---------- */
function Activity({ data }: { data: WalletKundli["activityByDay"] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const W = 320
  const H = 120
  const step = W / Math.max(1, data.length - 1)
  const pts = data.map((d, i) => [i * step, H - (d.count / max) * (H - 12) - 6] as const)

  // smooth cubic path
  const line = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }, "")
  const area = `${line} L ${W} ${H} L 0 ${H} Z`

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-muted">Activity — last 14 days</div>
        <div className="text-xs text-accent">{data.reduce((s, d) => s + d.count, 0)} tx</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill="url(#wave)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="url(#waveLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 1.4, ease: "easeInOut" }}
        />
        {pts.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill="#22d3ee"
            initial={{ opacity: 0 }}
            animate={{ opacity: data[i].count > 0 ? 1 : 0.15 }}
            transition={{ delay: 0.8 + i * 0.03 }}
          >
            <title>{`${data[i].date}: ${data[i].count} tx`}</title>
          </motion.circle>
        ))}
      </svg>
    </div>
  )
}

/* ---------- Badges ---------- */
function Badges({ badges }: { badges: WalletKundli["badges"] }) {
  return (
    <div className="glass p-6">
      <div className="mb-4 text-sm font-semibold text-muted">Achievements</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b, i) => (
          <motion.div
            key={b.id}
            className={`holo flex flex-col items-center rounded-xl border p-3 text-center transition ${
              b.earned
                ? "border-primary/40 bg-primary/10 btn-glow"
                : "border-white/5 bg-white/[0.02] opacity-40 grayscale"
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: b.earned ? 1 : 0.4, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            title={b.hint}
          >
            <div className="text-2xl">{b.emoji}</div>
            <div className="mt-1 text-xs font-medium">{b.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- AI Personality ---------- */
function Personality({ data }: { data: WalletKundli }) {
  const [text, setText] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [source, setSource] = React.useState<string>("")

  React.useEffect(() => {
    let alive = true
    setLoading(true)
    fetch("/api/personality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        address: data.address,
        balanceUSDC: data.balanceUSDC,
        txCount: data.txCount,
        gasUsed: data.gasUsed,
        tokenTransfers: data.tokenTransfers,
        walletAgeDays: data.walletAgeDays,
        rank: data.rank,
        score: data.score,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setText(d.personality ?? "")
        setSource(d.source ?? "")
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [data])

  return (
    <motion.div
      className="glass relative overflow-hidden p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-lg">🔮</span> AI Wallet Personality
        {source === "local" && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">demo</span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-1 text-muted">
          Analyzing your onchain soul
          <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            ...
          </motion.span>
        </div>
      ) : (
        <p className="text-lg leading-relaxed">{text}</p>
      )}
    </motion.div>
  )
}

/* ---------- Main dashboard ---------- */
export function KundliDashboard({ data }: { data: WalletKundli }) {
  const short = `${data.address.slice(0, 6)}…${data.address.slice(-4)}`

  const shareText = encodeURIComponent(
    `I just revealed my Arc Wallet Aura on @arc testnet 🔮\n\n` +
      `Rank: ${data.rank}\nScore: ${data.score}/1000\nTx: ${data.txCount}\n\n` +
      `Reveal yours 👇`
  )
  const shareUrl = `https://aetherfi.vercel.app/w/${data.address}`

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        className="glass relative grid grid-cols-1 items-center gap-6 overflow-hidden p-8 md:grid-cols-[auto_1fr]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* personal aura living inside the hero card */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <AuraCanvas address={data.address} params={auraParams(data)} className="h-full w-full" intense />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(11,14,31,0.85)_100%)]" />
        </div>
        <div className="relative z-10">
          <ScoreRing score={data.score} rank={data.rank} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="text-sm text-muted">Wallet</div>
          <div className="font-mono text-xl">{short}</div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div>
              <div className="text-3xl font-extrabold glow-text">
                <CountUp value={data.balanceUSDC} decimals={2} />
              </div>
              <div className="text-xs text-muted">USDC Balance</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold">
                <CountUp value={data.walletAgeDays} />
              </div>
              <div className="text-xs text-muted">Days on Arc</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold">
                Top <CountUp value={data.percentile} suffix="%" />
              </div>
              <div className="text-xs text-muted">Percentile</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Transactions" value={data.txCount} delay={0.1} />
        <Stat label="Gas Used" value={data.gasUsed} delay={0.2} />
        <Stat label="Token Transfers" value={data.tokenTransfers} delay={0.3} />
        <Stat label="Score" value={data.score} suffix=" / 1000" delay={0.4} />
      </div>

      <Reveal>
        <Personality data={data} />
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <Activity data={data.activityByDay} />
        </Reveal>
        <Reveal delay={120}>
          <Badges badges={data.badges} />
        </Reveal>
      </div>

      {/* Share */}
      <Reveal delay={200}>
        <motion.div
          className="glass flex flex-col items-center gap-4 p-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-sm text-muted">Share your Aura and challenge your frens 🔥</div>
          <div className="flex gap-3">
            <a
              data-magnetic
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Share on X
            </a>
            <a
              data-magnetic
              href={`https://testnet.arcscan.app/address/${data.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold transition hover:border-primary/40"
            >
              View on ArcScan
            </a>
          </div>
        </motion.div>
      </Reveal>
    </div>
  )
}
