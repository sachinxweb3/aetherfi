"use client";

import React, { useState } from "react";
import { Cpu, Zap, Server, CheckCircle2, RefreshCw } from "lucide-react";

export default function DepinStakingModule() {
  const [stakedGpus, setStakedGpus] = useState("4");
  const [isStaking, setIsStaking] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);

  const handleStakeGpu = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaking(true);
    setStakeSuccess(false);

    setTimeout(() => {
      setIsStaking(false);
      setStakeSuccess(true);
      setTimeout(() => setStakeSuccess(false), 3500);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>DePIN GPU Compute Staking Vaults</span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Real World AI Revenue
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Stake virtualized NVIDIA H100 compute nodes to earn real AI LLM inference revenue on Arc Chain.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            CURRENT APY: 24.8% (USDC)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Node Performance Summary */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>DePIN Node Network</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Active</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">TOTAL DEPIN CLUSTER POWER</span>
              <span className="text-lg font-bold text-cyan-400">1,024 H100 Equivalent</span>
            </div>

            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">DAILY AI INFERENCE PAYOUT</span>
              <span className="text-base font-bold text-emerald-400">$12,450.00 USDC / Day</span>
            </div>

            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">CLUSTER UPTIME</span>
              <span className="text-sm font-semibold text-purple-300">99.98% SLA Guaranteed</span>
            </div>
          </div>
        </div>

        {/* GPU Staking Form & Node Matrix */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Stake Virtualized GPU Compute Units</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Yield Paid in USDC</span>
          </div>

          <form onSubmit={handleStakeGpu} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400">SELECT GPU UNITS TO STAKE (NVIDIA H100 SLOTS)</span>
              <div className="flex items-center justify-between gap-3 bg-[#030509] border border-white/10 p-3 rounded-xl">
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={stakedGpus}
                  onChange={(e) => setStakedGpus(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                />
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-lg text-slate-300 font-bold">H100 NODES</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>Estimated Yearly Yield:</span>
                <span className="text-emerald-400 font-bold">${(parseInt(stakedGpus || "0") * 1250).toLocaleString()} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Network Contribution:</span>
                <span className="text-cyan-400">{(parseInt(stakedGpus || "0") * 80).toLocaleString()} TFLOPS Compute</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isStaking}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 py-3 text-xs font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isStaking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Provisioning DePIN GPU Cluster...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4" />
                  <span>Confirm DePIN GPU Node Staking</span>
                </>
              )}
            </button>
          </form>

          {stakeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Successfully staked {stakedGpus} H100 GPU compute nodes into Arc DePIN Cluster!</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}