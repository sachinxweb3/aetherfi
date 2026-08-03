import type { Metadata } from "next"
import { SettingsView } from "@/components/settings/SettingsView"

export const metadata: Metadata = {
  title: "Settings — AetherFI",
  description: "Your AetherFI preferences and account — motion, privacy, and local data. Everything stays in your browser.",
}

// /(app)/settings — preferences & account inside the shell route group.
export default function SettingsPage() {
  return <SettingsView />
}
