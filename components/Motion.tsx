"use client"

import * as React from "react"

/** Reveal-on-scroll wrapper (IntersectionObserver, respects reduced-motion). */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add("in"), delay)
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}

/** 3D magnetic tilt on hover (mouse only). Wrap any card. */
export function Tilt({
  children,
  className = "",
  max = 8,
}: {
  children: React.ReactNode
  className?: string
  max?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(6px)`
  }
  function reset() {
    const el = ref.current
    if (el) el.style.transform = "perspective(800px) rotateX(0) rotateY(0)"
  }
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`tilt ${className}`}
    >
      {children}
    </div>
  )
}
