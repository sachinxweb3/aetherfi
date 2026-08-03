import type { Metadata } from "next"
import { AnalyticsView } from "@/components/analytics/AnalyticsView"

export const metadata: Metadata = {
  title: "Analytics — AetherFI",
  description: "Explainable insights from your Arc activity — score breakdown, flow, and streaks. Read-only.",
}

// /(app)/analytics — insights inside the shell route group.
export default function AnalyticsPage() {
  return <AnalyticsView />
}
