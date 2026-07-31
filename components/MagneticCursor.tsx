"use client"

import * as React from "react"

/**
 * MagneticCursor — a glowing dot that trails the pointer with easing and
 * expands over interactive elements. Pure DOM/rAF, no deps. Disabled on
 * touch devices and when the OS prefers reduced motion.
 */
export function MagneticCursor() {
  const dotRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return

    const dot = dotRef.current!
    const ring = ringRef.current!
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let hovering = false
    let raf = 0

    function onMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`
      const t = e.target as HTMLElement
      hovering = !!t.closest("a, button, [data-magnetic]")
    }
    function loop() {
      raf = requestAnimationFrame(loop)
      rx += (mx - rx) * 0.15
      ry += (my - ry) * 0.15
      const s = hovering ? 2.4 : 1
      ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${s})`
      ring.style.opacity = hovering ? "0.9" : "0.5"
    }
    window.addEventListener("mousemove", onMove)
    raf = requestAnimationFrame(loop)
    document.body.classList.add("cursor-none")

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
      document.body.classList.remove("cursor-none")
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border border-accent/60 mix-blend-screen"
        style={{ transition: "opacity 0.3s" }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]"
      />
    </>
  )
}
