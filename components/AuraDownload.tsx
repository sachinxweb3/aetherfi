"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { paintAura } from "@/lib/auraPaint"
import type { WalletKundli } from "@/lib/arc"

// A small button that paints the wallet's aura to a canvas and downloads it as a
// PNG. Runs fully on the client, so it costs nothing and works offline.

export function AuraDownload({ data }: { data: WalletKundli }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [done, setDone] = React.useState(false)

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    paintAura(canvas, data.address, data, 1080)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `aura-${data.address.slice(0, 8)}.png`
      link.click()
      URL.revokeObjectURL(url)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    }, "image/png")
  }

  return (
    <>
      <button
        data-magnetic
        onClick={download}
        className="btn-ghost inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium"
      >
        {done ? (
          <><Check className="h-4 w-4 text-positive" aria-hidden="true" /> Saved</>
        ) : (
          "Download Aura"
        )}
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
