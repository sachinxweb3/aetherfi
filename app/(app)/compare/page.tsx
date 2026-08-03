import type { Metadata } from "next"
import { CompareView } from "@/components/compare/CompareView"

export const metadata: Metadata = {
  title: "Compare · AetherFI",
  description: "Put two Arc wallets side by side on the same real on-chain analysis. No fabricated metrics.",
}

export default function ComparePage() {
  return <CompareView />
}
