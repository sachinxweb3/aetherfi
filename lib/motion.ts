// AETHER motion system — one premium motion language for the whole product.
// Every surface imports from here so timing, easing, and entrance feel identical
// on the landing, the dashboard, and every inner view. Motion is slow, weighted,
// and purposeful. Nothing bounces; nothing rushes.

import type { Transition, Variants } from "framer-motion"

// The single signature easing. Used for every entrance, every hover, every fill.
export const EASE = [0.22, 1, 0.36, 1] as const

// Three durations. Most things use `base`. Larger reveals use `slow`.
export const DUR = { fast: 0.35, base: 0.6, slow: 0.9 } as const

// Rise-and-fade entrance. `reduced` collapses it to a plain fade with no shift so
// motion-sensitive users still get a settled layout instantly.
export function rise(reduced: boolean, delay = 0, distance = 16): {
  initial: false | { opacity: number; y: number }
  animate: { opacity: number; y: number }
  transition: Transition
} {
  return {
    initial: reduced ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : DUR.base, delay: reduced ? 0 : delay, ease: EASE },
  }
}

// Scroll-triggered variant of `rise` for landing sections. Plays once as the
// element enters the viewport.
export function riseIn(reduced: boolean, distance = 40): {
  initial: false | { opacity: number; y: number }
  whileInView: { opacity: number; y: number }
  viewport: { once: true; margin: string }
  transition: Transition
} {
  return {
    initial: reduced ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-120px" },
    transition: { duration: reduced ? 0 : DUR.slow, ease: EASE },
  }
}

// Staggered list children. Cap the delay so long lists never crawl.
export function stagger(reduced: boolean, index: number, step = 0.05, max = 0.3): {
  initial: false | { opacity: number; y: number }
  animate: { opacity: number; y: number }
  transition: Transition
} {
  return {
    initial: reduced ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : DUR.fast, delay: reduced ? 0 : Math.min(index * step, max), ease: EASE },
  }
}

// Container/child variants for orchestrated staggers where the parent drives timing.
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE } },
}
