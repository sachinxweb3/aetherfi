"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowDown,
  SlidersHorizontal,
  Zap,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function ArcSwapModule() {
  const [payAmount, setPayAmount] = useState("1000");
  const [payToken, setPayToken] = useState("USDC");
  const [receiveToken, setReceiveToken] = useState("ETH");
  const [slippage, setSlippage] = useState("0.01");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const calculateReceive = () => {
    const val = parseFloat(payAmount || "0");
    if (payToken === "USDC") return (val * 0.00028).toFixed(5);
    return (val / 0.00028).toFixed(2);
  };

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSwapping(true);
    setSwapSuccess(false);

    setTimeout(() => {
      setIsSwapping(false);
      setSwapSuccess(true);
      setTimeout(() => setSwapSuccess(false), 3500);
    }, 1600);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      
      {/* Swap Container */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#080B12] p-6 shadow-2xl space-y-4 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Arc FX Zero-Slippage DEX</h3>
              <p className="text-[11px] text-slate-400">Native USDC liquidity routing</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-slate-400">Max Slippage:</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              {slippage}%
            </span>
          </div>
        </div>

        {/* Swap Form */}
        <form onSubmit={handleSwap} className="space-y-3">
          
          {/* Pay Input */}
          <div className="rounded-xl border border-white/[0.08] bg-[#030509] p-4 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>YOU PAY</span>
              <span>Balance: 12,450.00 USDC</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full bg-transparent text-xl font-mono font-bold text-white focus:outline-none"
              />
              <span className="text-xs font-bold font-mono bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg text-white">
                {payToken}
              </span>
            </div>
          </div>

          {/* Swap Divider Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={() => {
                setPayToken(payToken === "USDC" ? "ETH" : "USDC");
                setReceiveToken(receiveToken === "ETH" ? "USDC" : "ETH");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#080B12] text-cyan-400 hover:border-cyan-500/40 hover:scale-105 transition-all shadow-md"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Receive Output */}
          <div className="rounded-xl border border-white/[0.08] bg-[#030509] p-4 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>YOU RECEIVE (ESTIMATED)</span>
              <span>Rate: 1 ETH = 3,571 USDC</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-mono font-bold text-emerald-400">
                {calculateReceive()}
              </span>
              <span className="text-xs font-bold font-mono bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg text-white">
                {receiveToken}
              </span>
            </div>
          </div>

          {/* Metric Details */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] font-mono text-[11px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Network Gas Fee:</span>
              <span className="text-cyan-400">0.0001 USDC Native</span>
            </div>
            <div className="flex justify-between">
              <span>AI Route Execution:</span>
              <span className="text-emerald-400">Direct Arc Testnet Pool</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSwapping}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 py-3 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {isSwapping ? (
              <span>Executing Arc Swap on-chain...</span>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Confirm Zero-Slippage Swap</span>
              </>
            )}
          </button>
        </form>

        {/* Success Alert */}
        {swapSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-mono text-emerald-300 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Swap executed successfully on Arc Testnet! Transaction ID: 0x8a...309</span>
          </motion.div>
        )}

      </div>

    </div>
  );
}