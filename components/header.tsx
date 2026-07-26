"use client"

import * as React from "react"
import Link from "next/link"
import { ConnectButton } from "@/components/wallet/ConnectButton"
import { Sparkles } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              AetherFI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Link
              href="#terminal"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              Terminal
            </Link>
            <Link
              href="#swarms"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              AI Swarms
            </Link>
            <Link
              href="#vaults"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              DePIN Vaults
            </Link>
            <Link
              href="#privacy"
              className="px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              ZK Shield
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Milestone 1 Active
          </div>

          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
