"use client"

import type { LucideIcon } from "lucide-react"
import {
  Sunrise,
  Zap,
  Flame,
  Fish,
  Target,
  Wrench,
  Droplets,
  Medal,
  Sparkles,
  Flower2,
  Crown,
  Rocket,
} from "lucide-react"

// A tiny registry that maps serializable string keys to Lucide line icons. Data
// layers (badges, modes) store a key, never a component, so they stay JSON-safe
// across the API. Render sites resolve the key to one icon family here.
export const ICONS: Record<string, LucideIcon> = {
  sunrise: Sunrise,
  zap: Zap,
  flame: Flame,
  whale: Fish,
  target: Target,
  wrench: Wrench,
  droplets: Droplets,
  medal: Medal,
  sparkles: Sparkles,
  zen: Flower2,
  crown: Crown,
  rocket: Rocket,
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Sparkles
  return <Cmp className={className} aria-hidden="true" />
}
