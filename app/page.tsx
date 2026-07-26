import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6 pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            AetherFI Operating System v1.0
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            The Agentic Financial Operating System
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl">
            Autonomous AI Swarms, ZK-Privacy Shield, Post-Quantum Security, and Spatial DeFi Terminal powered by Arc Chain.
          </p>
        </div>
      </main>
    </div>
  )
}