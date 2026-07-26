"use client";

import React, { useState, useEffect } from "react";
import { Bot, Cpu, Zap, Play, Pause, Activity, CheckCircle2, TrendingUp } from "lucide-react";

export default function AiSwarmsModule() {
  const [swarmsActive, setSwarmsActive] = useState(true);
  const [totalYieldGenerated, setTotalYieldGenerated] = useState(1482.50);
  const [tradesExecuted, setTradesExecuted] = useState(142);

  const [swarmLogs, setSwarmLogs] = useState<string[]>([
    "[Swarm #01] Yield Arbitrage: Routed 2,500 USDC to Arc Core Pool (+0.42% APY boost)",
    "[Swarm #02] MEV Guard: Blocked frontrunning attempt on transaction 0x8a...309",
    "[Swarm #03] Sentiment Bot: Rebalanced prediction odds to 78.4% YES",
  ]);

  useEffect(() => {
    if (!swarmsActive) return;

    const interval = setInterval(() => {
      setTotalYieldGenerated((prev) => prev + parseFloat((Math.random() * 0.15).toFixed(2)));
      setTradesExecuted((prev) => prev + 1);

      const dynamicLogs = [
        `[Swarm #01] Arbitrage Bot scanned 14 pools. Slippage: 0.00%`,
        `[Swarm #02] MEV Shield verified Zero-Knowledge bundle on Block #5042730`,
        `[Swarm #03] Sentiment AI scanned Twitter/X feed: Bullish momentum 84%`,
        `[Swarm #04] Yield Aggregator auto-compound triggered (+18.4% APY active)`,
      ];

      const newLog = dynamicLogs[Math.floor(Math.random() * dynamicLogs.length)];
      setSwarmLogs((prev) => [newLog, ...prev.slice(0, 2)]);
    }, 2500);

    return () => clearInterval(interval);
  }, [swarmsActive]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Autonomous AI Agent Swarms</span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Multi-Bot Matrix v4.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Parallel AI bots executing automated yield arbitrage, MEV protection, and risk hedging on Arc Chain.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSwarmsActive(!swarmsActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
              swarmsActive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {swarmsActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{swarmsActive ? "SWARMS ACTIVE" : "PAUSED"}</span>
          </button>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metrics Counter */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>Swarm Performance</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Live Telemetry</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">TOTAL AUTO-YIELD GENERATED</span>
              <span className="text-xl font-bold text-emerald-400">${totalYieldGenerated.toFixed(2)} USDC</span>
            </div>

            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">PARALLEL TRADES EXECUTED</span>
              <span className="text-lg font-bold text-cyan-400">{tradesExecuted} Trades</span>
            </div>

            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">AVERAGE EXECUTION LATENCY</span>
              <span className="text-sm font-semibold text-purple-300">0.02 Seconds (Arc Block Native)</span>
            </div>
          </div>
        </div>

        {/* Live Swarm Stream */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span>Multi-Agent Live Execution Stream</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-300">4 Active Swarms</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#030509] p-3 font-mono text-xs space-y-3 h-44 overflow-hidden">
            {swarmLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-cyan-300/90 text-[11px] leading-relaxed">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-mono flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Autonomous bots auto-compound yield and shield transactions on Arc Testnet.</span>
          </div>
        </div>

      </div>

    </div>
  );
}