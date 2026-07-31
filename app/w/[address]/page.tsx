import type { Metadata } from "next"
import Link from "next/link"
import { getKundli } from "@/lib/arc"
import { auraParams } from "@/lib/aura"
import { KundliDashboard } from "@/components/KundliDashboard"
import { AuraCanvas } from "@/components/AuraCanvas"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

interface Props {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params
  const og = `/api/og?address=${address}`
  const title = "AetherFi Aura — Arc Wallet Kundli"
  const description = "See this wallet's on-chain identity on Arc Testnet. Reveal yours — free."
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
          <div className="text-4xl">⚠️</div>
          <div className="text-xl font-semibold">Invalid wallet address</div>
          <Link href="/" className="text-accent">
            ← Back to AetherFi
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
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(5,6,15,0.72)_100%)]" />
      <div className="grid-overlay" />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🔮</span> AetherFi Aura
          </Link>
          <Link
            href="/"
            className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white"
          >
            Reveal My Aura
          </Link>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          <KundliDashboard data={data} />
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-xs text-muted">
          Built on Arc Testnet · Data via ArcScan · Free forever
        </footer>
      </div>
    </div>
  )
}
