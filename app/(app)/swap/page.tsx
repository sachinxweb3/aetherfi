import type { Metadata } from "next"
import { SwapView } from "@/components/swap/SwapView"

export const metadata: Metadata = {
  title: "Swap — AetherFI",
  description: "Exchange one Arc asset for another. You review every quote and sign in your own wallet.",
}

// /(app)/swap — asset swap inside the shell route group. Routing lives behind
// lib/swap's adapter; the UI never fabricates a quote (File 16 honesty).
export default function SwapPage() {
  return <SwapView />
}
