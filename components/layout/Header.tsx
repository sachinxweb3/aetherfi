"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageCircle, ExternalLink, ShieldCheck, Cpu, ChevronRight, Zap } from "lucide-react";

export default function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const [passcodeActive, setPasscodeActive] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand Logo & Founder Signature */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950">
                  <Zap className="h-5 w-5 text-cyan-400 fill-cyan-400/20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wider text-white">
                  AETHER<span className="text-cyan-400">FI</span>
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                  ARC TESTNET
                </span>
              </div>
            </Link>

            <span className="text-[11px] text-slate-400 border-l border-white/10 pl-3">
              Made by{" "}
              <a
                href="https://linktr.ee/sachinxweb3"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cyan-400 underline decoration-cyan-500/40 hover:text-cyan-300"
              >
                Sachin
              </a>
            </span>
          </div>
        </div>

        {/* Navigation Ecosystem Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          <Link href="/terminal" className="hover:text-cyan-400 transition-colors">
            DeFi Terminal
          </Link>
          <Link href="/prediction" className="hover:text-cyan-400 transition-colors">
            Prediction Market
          </Link>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ZK Vault
          </Link>
          <Link href="/docs" className="hover:text-cyan-400 transition-colors">
            Docs & Whitepaper
          </Link>
          <a
            href="https://arc.network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            Arc Ecosystem <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        {/* Action Controls & Contact Buttons */}
        <div className="flex items-center gap-3">
          {/* Direct WhatsApp Support Button */}
          <a
            href="https://wa.me/918950434723?text=Hi%20Sachin,%20I%20have%20a%20query%20regarding%20AetherFI"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>

          {/* Passcode / Shield Mode Toggle */}
          <button
            onClick={() => setPasscodeActive(!passcodeActive)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              passcodeActive
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>{passcodeActive ? "Shield Active" : "Shield Mode"}</span>
          </button>

          {/* Connect Wallet Button */}
          <button
            onClick={() => setIsConnected(!isConnected)}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl p-[1px] font-medium text-xs shadow-md"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-300 group-hover:opacity-90" />
            <span className="relative flex items-center gap-2 rounded-[11px] bg-slate-950 px-4 py-2 transition-all duration-300 group-hover:bg-opacity-0 text-white">
              {isConnected ? "0x5A...423" : "Connect Wallet"}
              <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}