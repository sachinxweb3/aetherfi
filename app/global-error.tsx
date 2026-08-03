"use client"

// Last-resort error boundary (Next 16 App Router). global-error replaces the
// root layout when a throw escapes it — e.g. a failure in layout.tsx or the
// wagmi/RainbowKit provider tree. It renders its OWN <html>/<body> and does NOT
// load globals.css, so every style here is inlined with the brand tokens.
// File 12: even a total root failure degrades to a recoverable screen, never blank.

import * as React from "react"

const BG = "#0a0a0b"
const FG = "#f2efe6"
const MUTED = "#9a978d"
const CHAMPAGNE = "#d8c08a"

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  React.useEffect(() => {
    console.error("AetherFI root error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "0 1.5rem",
          textAlign: "center",
          background: BG,
          color: FG,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>The aura collapsed</div>
        <p style={{ maxWidth: "28rem", color: MUTED, lineHeight: 1.6 }}>
          AetherFI hit an unexpected error while starting up. Your wallet and on-chain data are
          safe. Reloading usually clears it.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            border: "none",
            borderRadius: "9999px",
            padding: "0.7rem 1.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#201a0e",
            cursor: "pointer",
            background: `linear-gradient(180deg, #e6d3a2, ${CHAMPAGNE})`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.24) inset, 0 8px 30px rgba(216,192,138,0.12)",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
