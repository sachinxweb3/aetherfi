import type { Metadata } from "next"
import { AutomationView } from "@/components/automation/AutomationView"

export const metadata: Metadata = {
  title: "Automation — AetherFI",
  description: "Schedule recurring USDC payments on Arc Testnet. AetherFI reminds you when each is due — you review and sign every payment yourself.",
}

// /(app)/automation — scheduled & recurring payments, inside the app shell.
export default function AutomationPage() {
  return <AutomationView />
}
