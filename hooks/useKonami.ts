"use client"

import * as React from "react"

// Konami code listener: ↑↑↓↓←→←→BA
// Returns true when the sequence is entered. UI can respond with an easter egg.
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]

export function useKonami() {
  const [unlocked, setUnlocked] = React.useState(false)
  const bufRef = React.useRef<string[]>([])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      bufRef.current.push(k)
      if (bufRef.current.length > KONAMI.length) bufRef.current.shift()
      const match = KONAMI.every((c, i) => bufRef.current[i] === c)
      if (match && !unlocked) {
        setUnlocked(true)
        bufRef.current = []
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [unlocked])

  return unlocked
}
