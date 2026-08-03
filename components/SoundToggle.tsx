"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { SOUND_KEY, PREFS_EVENT, isSoundOn, soundValue } from "@/lib/prefs"

/**
 * Sound toggle — a soft procedural ambient drone built with the Web Audio API.
 * No audio files, nothing to download. Off by default, remembers your choice.
 */
export function SoundToggle() {
  const [on, setOn] = React.useState(false)
  const reduced = useReducedMotion()
  const ctxRef = React.useRef<AudioContext | null>(null)
  const nodesRef = React.useRef<{ gain: GainNode; oscs: OscillatorNode[] } | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const sync = () => setOn(isSoundOn(window.localStorage.getItem(SOUND_KEY)))
    sync()
    // Stay in sync when the preference is changed elsewhere (e.g. Settings).
    window.addEventListener(PREFS_EVENT, sync)
    return () => window.removeEventListener(PREFS_EVENT, sync)
  }, [])

  React.useEffect(() => {
    if (!on) {
      // tear down
      const n = nodesRef.current
      if (n && ctxRef.current) {
        n.gain.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.3)
        const nodes = n
        setTimeout(() => {
          nodes.oscs.forEach((o) => o.stop())
          ctxRef.current?.close()
          ctxRef.current = null
          nodesRef.current = null
        }, 500)
      }
      return
    }

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)
    // Two detuned low sines + a soft high shimmer = calm cosmic pad.
    const freqs = [110, 110.4, 220.8]
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i === 2 ? "triangle" : "sine"
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i === 2 ? 0.05 : 0.14
      o.connect(g)
      g.connect(gain)
      o.start()
      return o
    })
    nodesRef.current = { gain, oscs }
    gain.gain.setTargetAtTime(0.16, ctx.currentTime, 0.6)

    return () => {
      oscs.forEach((o) => {
        try {
          o.stop()
        } catch {}
      })
      ctx.close().catch(() => {})
      ctxRef.current = null
      nodesRef.current = null
    }
  }, [on])

  function toggle() {
    const next = !on
    setOn(next)
    window.localStorage.setItem(SOUND_KEY, soundValue(next))
    // Notify other surfaces (Settings) so they reflect the change live.
    window.dispatchEvent(new Event(PREFS_EVENT))
  }

  return (
    <button
      data-magnetic
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Mute ambient" : "Play ambient"}
      className="flex items-center gap-2 rounded-full border border-hairline bg-champagne/[0.03] px-4 py-2 text-xs font-medium text-silver-dim backdrop-blur transition hover:border-hairline-strong hover:text-foreground"
    >
      <span className="text-sm">{on ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}</span>
      {on ? "Ambient on" : "Ambient off"}
      {on && (
        <span className="flex items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-[2px] rounded-full bg-champagne"
              style={reduced ? { height: 8 } : undefined}
              animate={reduced ? undefined : { height: [4, 11, 4] }}
              transition={reduced ? undefined : { repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </span>
      )}
    </button>
  )
}
