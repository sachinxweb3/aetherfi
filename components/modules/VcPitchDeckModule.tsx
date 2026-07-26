"use client";

import React, { useState } from "react";
import { TrendingUp, Award, DollarSign, ChevronRight, ChevronLeft } from "lucide-react";

export default function VcPitchDeckModule() {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Market Opportunity & Problem",
      subtitle: "The Fragmented $100B DeFi & AI Agent Bottleneck",
      content:
        "Traditional DeFi suffers from high slippage, complex cross-chain gas tokens, and privacy vulnerabilities. AetherFI unifies Intent AI Swarms, ZK Stealth Privacy, and DePIN GPU Staking on Arc Chain native USDC.",
      metricLabel: "TARGET ADDRESSABLE MARKET (TAM)",
      metricValue: "$120 Billion",
    },
    {
      title: "Revenue Model & Protocol Economics",
      subtitle: "Multi-Stream Sustainable Protocol Income",
      content:
        "1) 0.05% Intent Engine Execution Fee\n2) 10% DePIN AI Compute Yield Commission\n3) Institutional SaaS API Licensing for ZK Credit Engine",
      metricLabel: "PROJECTED Y1 RUN-RATE REVENUE",
      metricValue: "$14.2M USDC",
    },
    {
      title: "AETHER Tokenomics Matrix",
      subtitle: "100,000,000 Fixed Token Distribution",
      content:
        "• 40% Ecosystem & AI Swarm Rewards\n• 20% Institutional VC & Strategic Partners\n• 20% Core Contributors & Founding Team (3 Year Lock)\n• 20% Liquidity Pools & Treasury Solvency Reserve",
      metricLabel: "INITIAL CIRCULATING SUPPLY",
      metricValue: "15% at TGE",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>VC Pitch Deck Portal & Tokenomics</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Institutional Portal
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Institutional investor presentation covering revenue models, unit economics, and tokenomics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlide((prev) => Math.max(0, prev - 1))}
              disabled={slide === 0}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 disabled:opacity-30 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-slate-300">
              Slide {slide + 1} / {slides.length}
            </span>
            <button
              onClick={() => setSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={slide === slides.length - 1}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 disabled:opacity-30 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Display */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-6 space-y-5">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-indigo-400 uppercase">PITCH DECK SLIDE {slide + 1}</span>
          <h3 className="text-xl font-bold text-white">{slides[slide].title}</h3>
          <p className="text-xs text-slate-400 font-mono">{slides[slide].subtitle}</p>
        </div>

        <div className="p-5 rounded-xl bg-[#030509] border border-white/[0.06] whitespace-pre-line font-mono text-xs text-slate-300 leading-relaxed">
          {slides[slide].content}
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-between font-mono">
          <span className="text-xs text-slate-400">{slides[slide].metricLabel}:</span>
          <span className="text-lg font-bold text-emerald-400">{slides[slide].metricValue}</span>
        </div>
      </div>

    </div>
  );
}