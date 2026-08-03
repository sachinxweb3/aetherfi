"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Sparkles, Wrench, Bot, Search, Droplet, Wallet, Rocket, Flame } from "lucide-react"
import { Icon } from "@/components/ui/icon"
import type { WalletKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import type { ModeId } from "@/lib/modes"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { AuraCanvas } from "@/components/AuraCanvas"
import { AuraDownload } from "@/components/AuraDownload"
import { AuraDNA } from "@/components/AuraDNA"
import { NetworkGraph } from "@/components/NetworkGraph"
import { TimeMachine } from "@/components/TimeMachine"
import { AuraBoost } from "@/components/AuraBoost"
import { SoundToggle } from "@/components/SoundToggle"
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
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(238,232,216,0.08)" strokeWidth="12" />
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
            <stop offset="0%" stopColor="#b8975a" />
            <stop offset="100%" stopColor="#9fc1d6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="champagne-sheen text-4xl font-bold">
          <CountUp value={score} />
        </div>
        <div className="text-xs text-silver-dim">/ 1000</div>
        <div className="mt-1 text-sm font-semibold text-champagne">{rank}</div>
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
        className="card-quiet p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <div className="text-xs uppercase tracking-wider text-silver-dim">{label}</div>
        <div className="numeric mt-2 text-2xl font-semibold text-foreground">
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
    <div className="card-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-silver">Activity, last 14 days</div>
        <div className="numeric text-xs text-champagne">{data.reduce((s, d) => s + d.count, 0)} tx</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8c08a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d8c08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8975a" />
            <stop offset="100%" stopColor="#9fc1d6" />
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
            fill="#d8c08a"
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
    <div className="card-primary p-6">
      <div className="mb-4 text-sm font-semibold text-silver">Achievements</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b, i) => (
          <motion.div
            key={b.id}
            className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
              b.earned
                ? "border-champagne/30 bg-champagne/[0.08]"
                : "border-hairline bg-champagne/[0.02] opacity-40 grayscale"
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: b.earned ? 1 : 0.4, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            title={b.hint}
          >
            <Icon name={b.icon} className="mx-auto h-6 w-6" />
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
  const reduced = useReducedMotion()

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
      className="card-primary relative overflow-hidden p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-5 w-5 text-champagne" aria-hidden="true" /> AI Wallet Personality
        {source === "local" && (
          <span className="rounded-full bg-champagne/[0.08] px-2 py-0.5 text-[10px] text-silver-dim">demo</span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-1 text-silver">
          Analyzing your onchain soul
          <motion.span
            animate={reduced ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.2 }}
          >
            ...
          </motion.span>
        </div>
      ) : (
        <p className="text-lg leading-relaxed">{text}</p>
      )}
    </motion.div>
  )
}

/* ---------- Builder view: raw data, API, MCP ---------- */
function BuilderView({ data }: { data: WalletKundli }) {
  const [copied, setCopied] = React.useState<string>("")
  function copy(id: string, text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(""), 1500)
    })
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "https://aetherfi.vercel.app"
  const apiUrl = `${origin}/api/kundli?address=${data.address}`
  const mcpConfig = `{
  "mcpServers": {
    "aetherfi": {
      "url": "${origin}/api/mcp"
    }
  }
}`

  const rows: [string, string][] = [
    ["address", data.address],
    ["score", `${data.score}`],
    ["rank", data.rank],
    ["txCount", `${data.txCount}`],
    ["balanceUSDC", `${data.balanceUSDC}`],
    ["gasUsed", `${data.gasUsed}`],
    ["tokenTransfers", `${data.tokenTransfers}`],
    ["walletAgeDays", `${data.walletAgeDays}`],
    ["percentile", `${data.percentile}`],
  ]

  return (
    <div className="space-y-6">
      <div className="card-primary p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wrench className="h-5 w-5 text-champagne" aria-hidden="true" /> Raw wallet data
        </div>
        <div className="overflow-hidden rounded-xl border border-hairline">
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className={`flex items-center justify-between gap-4 px-4 py-2 text-sm ${
                i % 2 ? "bg-champagne/[0.02]" : ""
              }`}
            >
              <span className="text-silver-dim">{k}</span>
              <span className="truncate font-mono text-xs text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-primary p-6">
        <div className="mb-2 text-sm font-semibold text-foreground">Public API</div>
        <p className="mb-3 text-xs text-silver">
          One GET request returns this wallet as JSON. No key, no rate limit games, free forever.
        </p>
        <button
          onClick={() => copy("api", apiUrl)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-hairline bg-obsidian/40 px-4 py-3 text-left font-mono text-xs transition hover:border-hairline-strong"
        >
          <span className="truncate text-foreground">GET {apiUrl}</span>
          <span className="shrink-0 text-champagne">{copied === "api" ? "copied" : "copy"}</span>
        </button>
      </div>

      <div className="card-primary p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bot className="h-5 w-5 text-champagne" aria-hidden="true" /> Connect from Claude or ChatGPT
        </div>
        <p className="mb-3 text-xs text-silver">
          AetherFI speaks MCP. Drop this into your AI client config and just ask it about any Arc
          wallet in plain language. Reads are free and safe, any transaction is prepared for you to
          sign yourself.
        </p>
        <button
          onClick={() => copy("mcp", mcpConfig)}
          className="w-full rounded-xl border border-hairline bg-obsidian/40 p-4 text-left transition hover:border-hairline-strong"
        >
          <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed text-foreground/90">
{mcpConfig}
          </pre>
          <div className="mt-2 text-right text-xs text-champagne">
            {copied === "mcp" ? "copied" : "copy config"}
          </div>
        </button>
      </div>
    </div>
  )
}

/* ---------- Arc Insider view: ecosystem lens ---------- */
function ArcInsiderView({ data }: { data: WalletKundli }) {
  const links = [
    { label: "Explorer", href: "https://testnet.arcscan.app", Icon: Search },
    { label: "Faucet", href: "https://faucet.circle.com", Icon: Droplet },
    { label: "This wallet", href: `https://testnet.arcscan.app/address/${data.address}`, Icon: Wallet },
  ]
  return (
    <div className="space-y-6">
      <div className="card-primary relative overflow-hidden p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Rocket className="h-5 w-5 text-champagne" aria-hidden="true" /> Arc Insider
          <span className="rounded-full bg-champagne/[0.12] px-2 py-0.5 text-[10px] text-champagne">team view</span>
        </div>
        <p className="text-xs text-silver">
          A read-only lens built for the Arc team. Same free data, framed around ecosystem health
          instead of a single score.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Chain ID" value={5042002} delay={0.1} />
        <Stat label="Wallet score" value={data.score} suffix=" / 1000" delay={0.2} />
        <Stat label="Wallet tx" value={data.txCount} delay={0.3} />
        <Stat label="Days active" value={data.walletAgeDays} delay={0.4} />
      </div>

      <div className="card-primary p-6">
        <div className="mb-4 text-sm font-semibold text-silver">Jump into the ecosystem</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {links.map((l) => (
            <a
              key={l.label}
              data-magnetic
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-hairline bg-champagne/[0.02] px-4 py-3 text-sm font-medium text-foreground transition hover:border-champagne/40"
            >
              <l.Icon className="h-5 w-5 text-champagne" aria-hidden="true" />
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Battle challenge input ---------- */
function BattleChallenge({ myAddress }: { myAddress: string }) {
  const [opp, setOpp] = React.useState("")
  const valid = /^0x[a-fA-F0-9]{40}$/.test(opp.trim())
  return (
    <div className="mt-2 flex w-full max-w-md flex-col items-center gap-2">
      <div className="text-xs text-silver-dim">Or battle another wallet, winner by score</div>
      <div className="flex w-full gap-2">
        <input
          value={opp}
          onChange={(e) => setOpp(e.target.value)}
          placeholder="0x opponent address"
          aria-label="Opponent wallet address to battle"
          className="flex-1 rounded-full border border-hairline bg-obsidian/40 px-4 py-2 text-xs text-foreground outline-none transition focus:border-champagne/50 focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        {valid ? (
          <a
            data-magnetic
            href={`/compare/${myAddress}/${opp.trim()}`}
            className="btn-champagne px-5 py-2 text-xs focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Battle
          </a>
        ) : (
          // Disabled state as a real <button disabled>: keyboard-perceivable and
          // announced as disabled, unlike an <a> with no href. File 11.
          <button
            type="button"
            disabled
            aria-label="Enter a valid opponent address to battle"
            className="cursor-not-allowed rounded-full border border-hairline px-5 py-2 text-xs font-medium text-silver-dim opacity-50"
          >
            Battle
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- Main dashboard ---------- */
export function KundliDashboard({ data, mode = "aura" }: { data: WalletKundli; mode?: ModeId }) {
  const short = `${data.address.slice(0, 6)}…${data.address.slice(-4)}`

  const shareText = encodeURIComponent(
    `I just revealed my Arc Wallet Aura on @arc testnet 🔮\n\n` +
      `Rank: ${data.rank}\nScore: ${data.score}/1000\nTx: ${data.txCount}\n\n` +
      `Reveal yours 👇`
  )
  const shareUrl = `https://aetherfi.vercel.app/w/${data.address}`

  // Builder and Arc Insider are fully distinct layouts.
  if (mode === "builder") return <BuilderView data={data} />
  if (mode === "arc") return <ArcInsiderView data={data} />

  const zen = mode === "zen"
  const legend = mode === "legend"

  return (
    <div className={`space-y-6 ${legend ? "legend-theme" : ""}`}>
      {/* Hero */}
      <motion.div
        className="card-hero relative grid grid-cols-1 items-center gap-6 overflow-hidden p-8 md:grid-cols-[auto_1fr]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* personal aura living inside the hero card */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <AuraCanvas address={data.address} params={auraParams(data)} className="h-full w-full" intense />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,11,0.85)_100%)]" />
        </div>
        <div className="relative z-10">
          <ScoreRing score={data.score} rank={data.rank} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="text-sm text-silver-dim">Wallet</div>
          <div className="font-mono text-xl text-foreground">{short}</div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div>
              <div className="champagne-sheen numeric text-3xl font-bold">
                <CountUp value={data.balanceUSDC} decimals={2} />
              </div>
              <div className="text-xs text-silver-dim">USDC Balance</div>
            </div>
            <div>
              <div className="numeric text-3xl font-semibold text-foreground">
                <CountUp value={data.walletAgeDays} />
              </div>
              <div className="text-xs text-silver-dim">Days on Arc</div>
            </div>
            <div>
              <div className="numeric text-3xl font-semibold text-foreground">
                Top <CountUp value={data.percentile} suffix="%" />
              </div>
              <div className="text-xs text-silver-dim">Percentile</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      {!zen && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Transactions" value={data.txCount} delay={0.1} />
          <Stat label="Gas Used" value={data.gasUsed} delay={0.2} />
          <Stat label="Token Transfers" value={data.tokenTransfers} delay={0.3} />
          <Stat label="Score" value={data.score} suffix=" / 1000" delay={0.4} />
        </div>
      )}

      <Reveal>
        <Personality data={data} />
      </Reveal>

      {!zen && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <Activity data={data.activityByDay} />
          </Reveal>
          <Reveal delay={120}>
            <Badges badges={data.badges} />
          </Reveal>
        </div>
      )}

      {!zen && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <AuraDNA data={data} />
          </Reveal>
          <Reveal delay={120}>
            <NetworkGraph data={data} />
          </Reveal>
        </div>
      )}

      {!zen && (
        <Reveal>
          <TimeMachine data={data} />
        </Reveal>
      )}

      {/* Share */}
      <Reveal delay={200}>
        <motion.div
          className="card-primary flex flex-col items-center gap-4 p-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-1.5 text-sm text-silver">Share your Aura and challenge your frens <Flame className="h-4 w-4 text-caution" aria-hidden="true" /></div>
          <div className="flex gap-3">
            <a
              data-magnetic
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-champagne px-6 py-2.5 text-sm"
            >
              Share on X
            </a>
            <a
              data-magnetic
              href={`https://testnet.arcscan.app/address/${data.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-6 py-2.5 text-sm font-medium"
            >
              View on ArcScan
            </a>
            <AuraDownload data={data} />
          </div>
          <BattleChallenge myAddress={data.address} />
          <div className="pt-1">
            <SoundToggle />
          </div>
        </motion.div>
      </Reveal>

      {/* Aura Boost — user signs a tiny self-transfer, dust never leaves the wallet */}
      <Reveal delay={240}>
        <AuraBoost />
      </Reveal>

      {/* Easter egg hint */}
      <div className="flex justify-center">
        <div className="rounded-full border border-hairline bg-champagne/[0.02] px-4 py-2 text-xs text-silver-dim backdrop-blur">
          <span className="opacity-70">Psst... try the Konami code</span>{" "}
          <span className="font-mono text-[10px] opacity-50">↑↑↓↓←→←→BA</span>
        </div>
      </div>
    </div>
  )
}
