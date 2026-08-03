"use client"

// Route-level error boundary (Next 16 App Router). Wraps page.tsx and its
// children — any render-time throw shows this recoverable fallback instead of a
// blank page. File 12: fail gracefully, always give the user a way forward.
// Uses the v16.2 `unstable_retry` to re-render the segment without a full reload.

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  React.useEffect(() => {
    // Surface for debugging; digest matches server logs in production.
    console.error("AetherFI render error:", error)
  }, [error])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(10,10,11,0.85)_100%)]" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-negative/30 bg-negative/[0.06] text-negative">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="text-xl font-semibold">The aura destabilised</div>
        <p className="max-w-sm text-silver-dim">
          Something threw while rendering this view. Your wallet and on-chain data are untouched.
          Try again to re-forge the page.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            data-magnetic
            onClick={() => unstable_retry()}
            className="btn-champagne inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
          <Link
            href="/"
            data-magnetic
            className="btn-ghost inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold"
          >
            Back to start
          </Link>
        </div>
      </div>
    </div>
  )
}
