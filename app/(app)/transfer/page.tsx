import type { Metadata } from "next"
import { TransferForm } from "@/components/transfer/TransferForm"

export const metadata: Metadata = {
  title: "Transfer — AetherFI",
  description: "Send native USDC on Arc Testnet. You review and sign every transfer in your own wallet.",
}

// /(app)/transfer — lives inside the shell route group alongside /dashboard.
export default function TransferPage() {
  return <TransferForm />
}
