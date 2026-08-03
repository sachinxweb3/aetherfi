import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, Sparkles } from "lucide-react"
import { getKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { KundliDashboard } from "@/components/KundliDashboard"
import { AuraCanvas } from "@/components/AuraCanvas"
import { SiteFooter } from "@/components/SiteFooter"
import { Wordmark } from "@/components/Wordmark"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

interface Props {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params

  if (!ADDR.test(address)) {
    const title = "AetherFI Aura — Arc Wallet Kundli"
    const description = "Reveal your on-chain identity on Arc Testnet — free."
    return { title, description }
  }

  const og = `/api/og?address=${address}`
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`

  // Per-wallet hook so shared links unfurl with real score/rank. Memoized with
  // the page's getKundli call, so this is not a second network round-trip.
  let title = `${short} · AetherFI Aura`
  let description = "See this wallet's on-chain identity on Arc Testnet. Reveal yours — free."
  try {
    const data = await getKundli(address)
    title = `${short} — ${data.rank} · ${data.score}/1000`
    description = `${short} scored ${data.score}/1000 on Arc Testnet (${data.rank}, ${data.txCount} tx). Reveal your own aura — free.`
  } catch {
    // Fall through with the generic-but-addressed copy above.
  }

  return {
    title,
    description,
    openGraph: { title, description, images: [og], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  }
}

export default async function WalletPage({ params }: Props) {
  const { address } = await params

  if (!ADDR.test(address)) {
    return (
      <div className="relative min-h-screen">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <div className="flex justify-center text-negative"><AlertTriangle className="h-9 w-9" aria-hidden="true" /></div>
          <div className="text-xl font-semibold">Invalid wallet address</div>
          <Link href="/" className="text-champagne">
            ← Back to AetherFI
          </Link>
        </div>
      </div>
    )
  }

  const data = await getKundli(address)

  return (
    <div className="relative min-h-screen">
      <div className="aura-layer">
        <AuraCanvas address={data.address} params={auraParams(data)} className="h-full w-full" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,11,0.72)_100%)]" />
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
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {/* Visually-hidden document heading — the design uses the score ring as
              the visual hero, so SR users get a proper <h1> without altering layout. */}
          <h1 className="sr-only">
            AetherFI Aura — wallet {data.address.slice(0, 6)}…{data.address.slice(-4)}, {data.rank}, score {data.score} of 1000
          </h1>
          <KundliDashboard data={data} />
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
