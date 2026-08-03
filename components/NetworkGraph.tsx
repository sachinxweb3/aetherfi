"use client"

import * as React from "react"
import type { WalletKundli } from "@/lib/arc"
import { seedFromAddress } from "@/lib/aura"

/**
 * Live Network Graph — the wallet as a hub with orbiting peers, drawn on a
 * canvas and gently animated. Node count scales with real token transfers, so
 * a busier wallet grows a denser constellation. Everything is deterministic
 * from the address, so the layout is stable across reloads.
 */
export function NetworkGraph({ data }: { data: WalletKundli }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const seeds = seedFromAddress(data.address)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let raf = 0
    let t = 0

    function size() {
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
    }
    size()

    // Peer count from real activity, clamped so it never crowds the card.
    const peers = Math.max(6, Math.min(22, Math.round(Math.log2(data.tokenTransfers + 2) * 3)))
    const nodes = Array.from({ length: peers }, (_, i) => {
      const a = (i / peers) * Math.PI * 2 + seeds[i % 4] * 6.283
      const ring = 0.45 + ((seeds[(i + 1) % 4] + i * 0.13) % 0.5)
      const spd = 0.15 + seeds[(i + 2) % 4] * 0.4
      return { a, ring, spd, r: 2 + (seeds[(i + 3) % 4] % 1) * 2.5 }
    })

    function draw() {
      const w = canvas!.width
      const h = canvas!.height
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.42
      ctx!.clearRect(0, 0, w, h)

      // edges
      for (const n of nodes) {
        const ang = n.a + t * n.spd * 0.02
        const x = cx + Math.cos(ang) * R * n.ring
        const y = cy + Math.sin(ang) * R * n.ring
        const g = ctx!.createLinearGradient(cx, cy, x, y)
        g.addColorStop(0, "rgba(216,192,138,0.35)")
        g.addColorStop(1, "rgba(159,193,214,0.05)")
        ctx!.strokeStyle = g
        ctx!.lineWidth = 1 * dpr
        ctx!.beginPath()
        ctx!.moveTo(cx, cy)
        ctx!.lineTo(x, y)
        ctx!.stroke()
      }
      // peer nodes
      for (const n of nodes) {
        const ang = n.a + t * n.spd * 0.02
        const x = cx + Math.cos(ang) * R * n.ring
        const y = cy + Math.sin(ang) * R * n.ring
        ctx!.fillStyle = "rgba(159,193,214,0.9)"
        ctx!.beginPath()
        ctx!.arc(x, y, n.r * dpr, 0, Math.PI * 2)
        ctx!.fill()
      }
      // hub (the wallet)
      const pulse = 6 + Math.sin(t * 0.05) * 2
      const hg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, pulse * 3 * dpr)
      hg.addColorStop(0, "rgba(216,192,138,1)")
      hg.addColorStop(1, "rgba(216,192,138,0)")
      ctx!.fillStyle = hg
      ctx!.beginPath()
      ctx!.arc(cx, cy, pulse * 3 * dpr, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = "#f2efe6"
      ctx!.beginPath()
      ctx!.arc(cx, cy, 4 * dpr, 0, Math.PI * 2)
      ctx!.fill()

      t += 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const onResize = () => size()
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [data.address, data.tokenTransfers])

  return (
    <div className="card-primary p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-silver">Network Graph</div>
        <div className="text-xs text-silver-dim">your wallet at the center</div>
      </div>
      <canvas ref={ref} className="h-56 w-full" />
    </div>
  )
}
