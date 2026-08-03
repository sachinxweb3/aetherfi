"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket } from "lucide-react"

// A quiet unlock link for the Arc team. Hitting this flips on Arc Insider mode
// and sends them back to the dashboard. No secret phrase typing needed.
export default function ArcInsiderUnlock() {
  const router = useRouter()

  React.useEffect(() => {
    try {
      localStorage.setItem("af_arc", "1")
    } catch {}
    const t = setTimeout(() => router.replace("/"), 900)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <div className="flex justify-center text-champagne"><Rocket className="h-12 w-12" aria-hidden="true" /></div>
      <div className="text-xl font-semibold">Arc Insider unlocked</div>
      <div className="text-sm text-silver-dim">Connect your wallet, then pick Arc Insider from the mode switcher.</div>
    </div>
  )
}
