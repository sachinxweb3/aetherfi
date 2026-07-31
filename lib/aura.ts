import type { WalletKundli } from "./arc"
import type { AuraParams } from "@/components/AuraCanvas"

/**
 * Deterministic hash of an address → 4 seeds in [0,1). Shared by the WebGL
 * aura and the OG image so a wallet's on-screen art and its share card match.
 */
export function seedFromAddress(address?: string | null): [number, number, number, number] {
  const s = (address ?? "0xaetherfiaura").toLowerCase()
  let h1 = 0x811c9dc5
  let h2 = 0x1000193
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }
  return [
    (h1 & 0xffff) / 0xffff,
    ((h1 >>> 16) & 0xffff) / 0xffff,
    (h2 & 0xffff) / 0xffff,
    ((h2 >>> 16) & 0xffff) / 0xffff,
  ]
}

/** Map on-chain stats → aura shader params (all normalized 0..1). */
export function auraParams(k?: WalletKundli | null): AuraParams {
  if (!k) return { energy: 0.4, density: 0.35, pulse: 0.35, rings: 0.35 }
  return {
    energy: Math.min(1, k.score / 1000),
    density: Math.min(1, Math.log10(k.txCount + 1) / 3),
    pulse: Math.min(1, Math.log10(k.balanceUSDC + 1) / 4),
    rings: Math.min(1, k.walletAgeDays / 90),
  }
}
