import type { Metadata } from "next"
import { SecurityView } from "@/components/security/SecurityView"

export const metadata: Metadata = {
  title: "Security — AetherFI",
  description: "A read-only checkup of your wallet's on-chain security posture. Derived from your real Arc activity.",
}

// /(app)/security — wallet security checkup inside the shell route group.
export default function SecurityPage() {
  return <SecurityView />
}
