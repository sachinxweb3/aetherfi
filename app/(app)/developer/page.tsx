import type { Metadata } from "next"
import { DeveloperView } from "@/components/developer/DeveloperView"

export const metadata: Metadata = {
  title: "Developer — AetherFI",
  description: "AetherFI's free public API and MCP integration surface for Arc wallet data.",
}

export default function DeveloperPage() {
  return <DeveloperView />
}
