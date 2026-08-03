"use client"

import * as React from "react"
import { MOTION_KEY, PREFS_EVENT, isMotionPref, resolveReducedMotion } from "@/lib/prefs"

/**
 * useReducedMotion — resolves the effective "reduce motion" boolean from the
 * user's AETHER preference (Settings) layered over the OS
 * `prefers-reduced-motion` setting. Constitution File 05 (WCAG 2.2) + File 11:
 * motion must reduce instantly when either the OS or the user asks for it, and
 * an explicit in-app choice always wins over the system default.
 *
 * SSR-safe: starts `false` on the server and syncs on mount so hydration never
 * mismatches. Updates live on OS change, on cross-tab storage writes, and on
 * the in-app PREFS_EVENT so the Settings toggle takes effect immediately.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")

    const compute = () => {
      let pref: string | null = null
      try {
        pref = window.localStorage.getItem(MOTION_KEY)
      } catch {}
      const motionPref = isMotionPref(pref) ? pref : "system"
      setReduced(resolveReducedMotion(motionPref, mq.matches))
    }

    compute()
    mq.addEventListener("change", compute)
    window.addEventListener("storage", compute)
    window.addEventListener(PREFS_EVENT, compute)
    return () => {
      mq.removeEventListener("change", compute)
      window.removeEventListener("storage", compute)
      window.removeEventListener(PREFS_EVENT, compute)
    }
  }, [])

  return reduced
}
