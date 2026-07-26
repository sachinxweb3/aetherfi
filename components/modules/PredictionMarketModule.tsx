"use client";

import React, { useState } from "react";
import { Activity, CheckCircle2, Zap } from "lucide-react";

export default function PredictionMarketModule() {
  const [betAmount, setBetAmount] = useState("100");
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO">("YES");
  const [betPlaced, setBetPlaced] = useState(false);

  const handleBet = (e: React.FormEvent) => {
    e.preventDefault();
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-[#090C15] p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>High-Speed Prediction Market</span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Arc Odds Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Decentralized market betting settled directly in native USDC on Arc Chain.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          TOTAL POOL: $148,500 USDC
        </span>
      </div>

      {/* Main Prediction Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-6 space-y-5">
        
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-cyan-400 uppercase">ACTIVE MARKET PROPOSAL #04</span>
          <h3 className="text-base font-bold text-white">Will Ethereum (ETH) surpass $4,500 before Q4 2026?</h3>
          <p className="text-xs text-slate-400">Resolves automatically via Chainlink / Pyth Arc Oracle Feed on Dec 31, 2026.</p>
        </div>

        {/* Probability Bar */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>YES (78% Probability) — <strong className="text-emerald-400">1.28x Payout</strong></span>
            <span>NO (22% Probability) — <strong className="text-red-400">4.50x Payout</strong></span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-[78%]" />
            <div className="h-full bg-red-500/80 w-[22%]" />
          </div>
        </div>

        {/* Bet Selection Form */}
        <form onSubmit={handleBet} className="grid sm:grid-cols-3 gap-4 pt-2">
          
          <div className="sm:col-span-1 space-y-2">
            <span className="text-[10px] font-mono text-slate-400">SELECT POSITION</span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedOutcome("YES")}
                className={`py-2.5 rounded-xl font-bold border transition-all ${
                  selectedOutcome === "YES"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-[#030509] text-slate-400 border-white/10"
                }`}
              >
                YES (1.28x)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOutcome("NO")}
                className={`py-2.5 rounded-xl font-bold border transition-all ${
                  selectedOutcome === "NO"
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-[#030509] text-slate-400 border-white/10"
                }`}
              >
                NO (4.50x)
              </button>
            </div>
          </div>

          <div className="sm:col-span-1 space-y-2">
            <span className="text-[10px] font-mono text-slate-400">BET AMOUNT (USDC)</span>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 py-2.5 text-xs font-bold text-white transition-all shadow-lg active:scale-95"
            >
              Place Prediction Bet
            </button>
          </div>

        </form>

        {betPlaced && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Bet of {betAmount} USDC placed on {selectedOutcome}! Potential Payout: ${(parseFloat(betAmount) * (selectedOutcome === "YES" ? 1.28 : 4.5)).toFixed(2)} USDC</span>
          </div>
        )}

      </div>

    </div>
  );
}