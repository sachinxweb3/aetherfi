
"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, RefreshCw } from "lucide-react";

export default function RwaVaultsModule() {
  const [investAmount, setInvestAmount] = useState("1000");
  const [selectedVault, setSelectedVault] = useState("US Treasury Bills");
  const [isInvesting, setIsInvesting] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(false);

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInvesting(true);
    setInvestSuccess(false);

    setTimeout(() => {
      setIsInvesting(false);
      setInvestSuccess(true);
      setTimeout(() => setInvestSuccess(false), 3500);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Real-World Asset (RWA) Fractional Vaults</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Institutional Yield
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Access fractionalized institutional U.S. Treasury Bills, Prime Real Estate, and Gold directly via Arc Chain.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            TOTAL TVL: $24.8M USDC
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Available RWA Vaults */}
        <div className="md:col-span-2 space-y-3">
          
          <div
            onClick={() => setSelectedVault("US Treasury Bills")}
            className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
              selectedVault === "US Treasury Bills"
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-white/[0.08] bg-[#080B12] hover:border-white/20"
            }`}
          >
            <div className="flex justify-between items-center font-mono">
              <span className="text-xs font-bold text-white">US Short-Term Treasury Bills (fT-BILL)</span>
              <span className="text-xs text-emerald-400 font-bold">5.2% Fixed APY</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Backed 1:1 by short-term US Treasury obligations. Daily USDC interest payouts on Arc Chain.
            </p>
          </div>

          <div
            onClick={() => setSelectedVault("Dubai Commercial Real Estate")}
            className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
              selectedVault === "Dubai Commercial Real Estate"
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-white/[0.08] bg-[#080B12] hover:border-white/20"
            }`}
          >
            <div className="flex justify-between items-center font-mono">
              <span className="text-xs font-bold text-white">Dubai Prime Commercial Real Estate (fPROP)</span>
              <span className="text-xs text-emerald-400 font-bold">8.6% Rental APY</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Fractional ownership in prime commercial properties with quarterly property value appreciation.
            </p>
          </div>

        </div>

        {/* Investment Execution Form */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white">Deposit into RWA Vault</span>
            <span className="text-[10px] font-mono text-cyan-400">USDC Settlement</span>
          </div>

          <form onSubmit={handleInvest} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">SELECTED VAULT</span>
              <div className="p-2.5 rounded-xl bg-[#030509] border border-white/10 text-cyan-300 font-bold truncate">
                {selectedVault}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">DEPOSIT AMOUNT (USDC)</span>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isInvesting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 py-3 text-xs font-bold text-slate-950 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isInvesting ? "animate-spin" : ""}`} />
              <span>{isInvesting ? "Processing..." : "Deposit USDC into RWA"}</span>
            </button>
          </form>

          {investSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Successfully deposited {investAmount} USDC into {selectedVault}!</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}