import type { Metadata } from "next"
import { ActivityList } from "@/components/activity/ActivityList"

export const metadata: Metadata = {
  title: "Activity — AetherFI",
  description: "Your recent transactions on Arc Testnet. Read-only, powered by ArcScan.",
}

// /(app)/activity — read-only history inside the shell route group.
export default function ActivityPage() {
  return <ActivityList />
}
