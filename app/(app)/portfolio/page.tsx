import type { Metadata } from "next"
import { PortfolioView } from "@/components/portfolio/PortfolioView"

export const metadata: Metadata = {
  title: "Portfolio — AetherFI",
  description: "Your holdings on Arc Testnet. Read-only, powered by ArcScan.",
}

// /(app)/portfolio — read-only holdings inside the shell route group.
export default function PortfolioPage() {
  return <PortfolioView />
}
