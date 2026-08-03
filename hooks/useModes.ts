"use client"

import * as React from "react"
import { ARC_SECRET, type ModeId } from "@/lib/modes"

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"]

/**
 * Central mode state. Handles the active mode plus which locked modes the user
 * has unlocked (konami for God, a typed secret for Arc Insider, score for
 * Legend). Unlocks persist in localStorage so they survive a refresh.
 */
export function useModes(score: number) {
  const [mode, setMode] = React.useState<ModeId>("aura")
  const [godUnlocked, setGodUnlocked] = React.useState(false)
  const [arcUnlocked, setArcUnlocked] = React.useState(false)

  const legendUnlocked = score >= 800

  // restore unlocks
  React.useEffect(() => {
    try {
      if (localStorage.getItem("af_god") === "1") setGodUnlocked(true)
      if (localStorage.getItem("af_arc") === "1") setArcUnlocked(true)
    } catch {}
  }, [])

  // konami → god, and typed "arcteam" → arc insider
  React.useEffect(() => {
    let kb: string[] = []
    let phrase = ""
    let timer: ReturnType<typeof setTimeout>
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()

      // konami buffer
      kb.push(k)
      if (kb.length > KONAMI.length) kb.shift()
      if (KONAMI.every((c, i) => kb[i] === c)) {
        setGodUnlocked(true)
        setMode("god")
        try { localStorage.setItem("af_god", "1") } catch {}
        kb = []
      }

      // secret phrase buffer (letters only, resets after a pause)
      if (/^[a-z]$/.test(k)) {
        phrase = (phrase + k).slice(-ARC_SECRET.length)
        clearTimeout(timer)
        timer = setTimeout(() => (phrase = ""), 2000)
        if (phrase === ARC_SECRET) {
          setArcUnlocked(true)
          setMode("arc")
          try { localStorage.setItem("af_arc", "1") } catch {}
          phrase = ""
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(timer)
    }
  }, [])

  const unlockArcViaUrl = React.useCallback(() => {
    setArcUnlocked(true)
    setMode("arc")
    try { localStorage.setItem("af_arc", "1") } catch {}
  }, [])

  return { mode, setMode, godUnlocked, arcUnlocked, legendUnlocked, unlockArcViaUrl }
}
