import Header from "@/components/layout/Header";
import { ArrowRight, Shield, Cpu, Globe, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Hero Section */}
      <main className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[800px] bg-gradient-to-tr from-violet-600/20 via-cyan-500/20 to-purple-600/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            The Autonomous Agentic Financial OS on Arc
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 max-w-4xl mx-auto leading-tight">
            AI-Driven DeFi, ZK-Privacy & Intent Engine
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to AetherFI. Engineered for Arc Chain with native USDC settlement, zero-knowledge privacy protection, autonomous AI swarms, and instant prediction markets.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/terminal"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 transition-all"
            >
              Launch Terminal <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="https://linktr.ee/sachinxweb3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Founder Profile (Sachin)
            </a>
          </div>

          {/* Key Metric Features Grid */}
          <div className="mt-20 grid sm:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
              <Shield className="h-8 w-8 text-cyan-400 mb-4" />
              <h3 className="text-base font-semibold text-white">ZK-Privacy Vault</h3>
              <p className="mt-2 text-xs text-slate-400">
                Encrypted activity logs with passcode authentication to hide sensitive transactions on public explorers.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
              <Cpu className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-semibold text-white">AI Swarm Engine</h3>
              <p className="mt-2 text-xs text-slate-400">
                Autonomous agent swarms executing multi-step swaps and yield strategies with dynamic slippage control.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
              <Globe className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-semibold text-white">Arc Native Gas</h3>
              <p className="mt-2 text-xs text-slate-400">
                Seamless native USDC gas settlement built for high-throughput Arc Testnet & Mainnet execution.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}