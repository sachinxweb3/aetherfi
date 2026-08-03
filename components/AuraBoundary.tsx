"use client"

// Local error boundary for the WebGL aura. If the shader / ogl renderer throws
// at render time, we swallow it and render the fallback (null by default, so the
// CSS `.aura-layer` aurora shows through) instead of taking down the whole page.
// File 12: a decorative subsystem must never white-screen the app.

import * as React from "react"

export class AuraBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Non-fatal: the aura is decorative. Log for visibility only.
    console.warn("AuraCanvas failed, falling back to CSS aurora:", error)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
