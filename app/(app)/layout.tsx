import type { Metadata } from "next"
import { AppShell } from "@/components/shell/AppShell"

// Route group (app): every route here is wrapped in the persistent AETHER shell
// (sidebar + top bar). The viral landing at "/" stays outside this group, so it
// keeps its full-bleed aura layout. Files 02/03 (app shell + OS navigation).
export const metadata: Metadata = {
  title: "Dashboard — AetherFI",
  description: "Your Arc Testnet financial operating dashboard — portfolio, activity and quick actions.",
}

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
