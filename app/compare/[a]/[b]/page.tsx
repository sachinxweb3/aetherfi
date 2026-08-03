import type { Metadata } from "next"
import Link from "next/link"
import { Crown, AlertTriangle, Sparkles } from "lucide-react"
import { getKundli, type WalletKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { AuraCanvas } from "@/components/AuraCanvas"
import { SiteFooter } from "@/components/SiteFooter"
import { Wordmark } from "@/components/Wordmark"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

interface Props {
  params: Promise<{ a: string; b: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await params

  if (!ADDR.test(a) || !ADDR.test(b)) {
    const title = "Aura Battle — AetherFI"
    const description = "Two Arc wallets, one aura battle. See who wins."
    return { title, description }
  }

  // Battle OG card (both wallets) + per-pair hook with scores and winner.
  const og = `/api/og?a=${a}&b=${b}`
  let title = `${short(a)} vs ${short(b)} — Aura Battle`
  let description = "Two Arc wallets, one aura battle. See who wins — reveal your own, free."
  try {
    const [da, db] = await Promise.all([getKundli(a), getKundli(b)])
    const winner = da.score >= db.score ? short(a) : short(b)
    title = `${short(a)} (${da.score}) vs ${short(b)} (${db.score}) — Aura Battle`
    description = `${winner} wins this Aura Battle on Arc Testnet. Score your own wallet — free.`
  } catch {
    // Fall through with generic-but-addressed copy.
  }

  return {
    title,
    description,
    openGraph: { title, description, images: [og], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  }
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

// One side of the battle card.
function Fighter({ data, win }: { data: WalletKundli; win: boolean }) {
  return (
    <div
      className={`card-primary relative flex flex-col items-center gap-4 overflow-hidden p-8 ${
        win ? "border-champagne/40" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <AuraCanvas address={data.address} params={auraParams(data)} className="h-full w-full" intense />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,11,0.85)_100%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        {win && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-champagne/[0.12] px-3 py-1 text-xs font-semibold text-champagne">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Winner
          </div>
        )}
        <div className="font-mono text-lg">{short(data.address)}</div>
        <div className="champagne-sheen text-5xl font-extrabold numeric">{data.score}</div>
        <div className="text-xs text-silver-dim">/ 1000 · {data.rank}</div>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-center text-sm">
          <div className="text-silver-dim">Tx</div>
          <div className="font-semibold">{data.txCount}</div>
          <div className="text-silver-dim">USDC</div>
          <div className="font-semibold">{data.balanceUSDC.toFixed(2)}</div>
          <div className="text-silver-dim">Days</div>
          <div className="font-semibold">{data.walletAgeDays}</div>
          <div className="text-silver-dim">Percentile</div>
          <div className="font-semibold">Top {data.percentile}%</div>
        </div>
      </div>
    </div>
  )
}

export default async function ComparePage({ params }: Props) {
  const { a, b } = await params

  if (!ADDR.test(a) || !ADDR.test(b)) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <div className="grid-overlay" />
        <div className="flex justify-center text-negative"><AlertTriangle className="h-9 w-9" aria-hidden="true" /></div>
        <div className="text-xl font-semibold">Two valid wallet addresses are needed</div>
        <Link href="/" className="text-champagne">
          ← Back to AetherFI
        </Link>
      </div>
    )
  }

  const [da, db] = await Promise.all([getKundli(a), getKundli(b)])
  const aWins = da.score >= db.score

  return (
    <div className="relative min-h-screen">
      <div className="grid-overlay" />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-champagne" aria-hidden="true" /> <Wordmark /> <span className="text-silver">Aura</span>
          </Link>
          <Link
            href="/"
            className="btn-champagne rounded-full px-5 py-2 text-sm font-semibold"
          >
            Reveal my aura
          </Link>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Aura <span className="champagne-sheen">Battle</span>
            </h1>
            <p className="mt-2 text-sm text-silver-dim">
              {short(a)} vs {short(b)} · winner is decided by score
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
            <Fighter data={da} win={aWins} />
            <div className="flex items-center justify-center text-2xl font-black text-silver-dim">
              VS
            </div>
            <Fighter data={db} win={!aWins} />
          </div>

          <div className="mt-8 flex justify-center">
            <a
              data-magnetic
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Aura Battle on Arc 🔮 ${short(a)} vs ${short(b)} — who wins?`
              )}&url=${encodeURIComponent(`https://aetherfi.vercel.app/compare/${a}/${b}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-champagne rounded-full px-6 py-2.5 text-sm font-semibold"
            >
              Share this battle
            </a>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
