import { seedFromAddress } from "@/lib/aura"
import type { WalletKundli } from "@/lib/arc"

// Paints a wallet's aura onto a 2D canvas so it can be downloaded as a PNG. This
// is a calmer cousin of the WebGL shader: same address seed, same color story,
// but drawn with layered radial glows and orbit rings so it exports cleanly on
// any device. Free, offline, no assets.

export function paintAura(
  canvas: HTMLCanvasElement,
  address: string,
  data?: WalletKundli | null,
  size = 1080
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  canvas.width = size
  canvas.height = size

  const [a, b, c, d] = seedFromAddress(address)
  const energy = data ? Math.min(1, data.score / 1000) : 0.5
  const rings = data ? Math.min(1, data.walletAgeDays / 90) : 0.4
  const density = data ? Math.min(1, Math.log10(data.txCount + 1) / 3) : 0.4

  const hueA = 220 + a * 90
  const hueB = 160 + b * 80
  const hueC = (hueA + 40) % 360

  // deep space base
  const base = ctx.createLinearGradient(0, 0, size, size)
  base.addColorStop(0, "#05060f")
  base.addColorStop(1, "#0a0b1a")
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // glow blobs, positions driven by seed
  const blobs: [number, number, number, string][] = [
    [0.1 + c * 0.4, 0.05 + d * 0.35, 0.55, `hsla(${hueA}, 90%, 65%, 0.55)`],
    [0.6 + a * 0.35, 0.6 + b * 0.35, 0.6, `hsla(${hueB}, 85%, 60%, 0.5)`],
    [0.3 + d * 0.5, 0.3, 0.5, `hsla(${hueC}, 80%, 60%, 0.4)`],
  ]
  ctx.globalCompositeOperation = "lighter"
  for (const [px, py, r, color] of blobs) {
    const x = px * size
    const y = py * size
    const rad = r * size * (0.5 + energy * 0.6)
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, color)
    g.addColorStop(1, "transparent")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }

  // orbit rings from wallet age
  const cx = size / 2
  const cy = size / 2
  const ringCount = Math.floor(2 + rings * 5)
  ctx.lineWidth = 2
  for (let i = 1; i <= ringCount; i++) {
    const rr = (i / (ringCount + 1)) * size * 0.46
    ctx.strokeStyle = `hsla(${hueB}, 80%, 70%, ${0.06 + density * 0.1})`
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.stroke()
  }

  // bright core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.28)
  core.addColorStop(0, `hsla(${hueA}, 90%, 80%, ${0.35 + energy * 0.4})`)
  core.addColorStop(1, "transparent")
  ctx.fillStyle = core
  ctx.fillRect(0, 0, size, size)

  // vignette
  ctx.globalCompositeOperation = "source-over"
  const vg = ctx.createRadialGradient(cx, cy, size * 0.3, cx, cy, size * 0.7)
  vg.addColorStop(0, "transparent")
  vg.addColorStop(1, "rgba(3,4,10,0.85)")
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, size, size)

  // caption
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(232,236,255,0.95)"
  ctx.font = `600 ${Math.round(size * 0.042)}px system-ui, sans-serif`
  ctx.fillText(short, cx, size * 0.9)
  if (data) {
    ctx.fillStyle = "rgba(139,147,183,0.9)"
    ctx.font = `500 ${Math.round(size * 0.028)}px system-ui, sans-serif`
    ctx.fillText(`${data.rank}  ·  ${data.score}/1000`, cx, size * 0.945)
  }
  // Brand lockup, two-tone: "Aether" ivory, "FI" champagne, " Aura" silver.
  // Drawn as measured runs so the whole word stays optically centered on cx.
  ctx.font = `700 ${Math.round(size * 0.024)}px system-ui, sans-serif`
  const parts: Array<{ t: string; c: string }> = [
    { t: "Aether", c: "rgba(242,239,230,0.95)" },
    { t: "FI", c: "rgba(216,192,138,0.95)" },
    { t: "  Aura", c: "rgba(154,151,141,0.9)" },
  ]
  const total = parts.reduce((w, p) => w + ctx.measureText(p.t).width, 0)
  ctx.textAlign = "left"
  let x = cx - total / 2
  for (const p of parts) {
    ctx.fillStyle = p.c
    ctx.fillText(p.t, x, size * 0.07)
    x += ctx.measureText(p.t).width
  }
  ctx.textAlign = "center"
}
