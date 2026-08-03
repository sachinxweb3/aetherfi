import React from "react";
import Link from "next/link";
import { Zap, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#02040A] text-slate-400 text-xs py-8 px-4 sm:px-6 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand Section */}
        <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-white tracking-wider">AETHERFI</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-sm">
            The Agentic Financial OS built natively on Arc Chain with ZK-Privacy, AI Swarms, and USDC Settlement.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8 font-medium text-slate-300">
          <Link href="/" className="hover:text-cyan-400 transition-colors">DeFi Terminal</Link>
          <Link href="/" className="hover:text-cyan-400 transition-colors">Prediction Market</Link>
          <Link href="/" className="hover:text-cyan-400 transition-colors">ZK Vault & Shield</Link>
          <Link href="/" className="hover:text-cyan-400 transition-colors">Docs & Whitepaper</Link>
        </div>

        {/* Author / Rights */}
        <div className="flex flex-col items-center md:items-end gap-1 text-[11px] text-slate-500">
          <p>© 2026 AetherFI. All rights reserved.</p>
          <p className="inline-flex items-center gap-1">Designed & Engineered with <Heart className="h-3 w-3 text-rose-400 fill-rose-400" aria-label="love" /> by <span className="text-cyan-400 font-semibold">Sachin</span></p>
        </div>

      </div>
    </footer>
  );
}