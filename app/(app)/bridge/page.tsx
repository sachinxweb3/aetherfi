import type { Metadata } from "next"
import { BridgeView } from "@/components/bridge/BridgeView"

export const metadata: Metadata = {
  title: "Bridge — AetherFI",
  description: "Move an Arc asset to another network. You review every estimate and sign in your own wallet.",
}

// /(app)/bridge — cross-chain transfer inside the shell route group. Routing
// lives behind lib/bridge's adapter; the UI never fabricates a route, fee or
// ETA (File 16 honesty).
export default function BridgePage() {
  return <BridgeView />
}
