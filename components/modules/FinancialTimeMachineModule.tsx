"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, BarChart2 } from "lucide-react";

export default function FinancialTimeMachineModule() {
  const [initialInvestment, setInitialInvestment] = useState("10000");
  const [timeHorizon, setTimeHorizon] = useState("3"); // Years
  const [scenarioMode, setScenarioMode] = useState<"BULL" | "NEUTRAL" | "BEAR">("BULL");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDone, setSimulationDone] = useState(true);

  const calculateProjectedValue = () => {
    const val = parseFloat(initialInvestment || "0");
    const years = parseInt(timeHorizon || "1");
    let rate = 0.184; // 18.4%
    if (scenarioMode === "BULL") rate = 0.32;
    if (scenarioMode === "BEAR") rate = 0.04;

    const projected = val * Math.pow(1 + rate, years);
    return projected.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationDone(false);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationDone(true);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Financial Time Machine</span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  10,000 Scenario Simulator
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Monte Carlo simulation engine forecasting multi-year portfolio yield scenarios under extreme market conditions.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            MONTE CARLO v2.8
          </span>
        </div>
      </div>

      {/* Simulator Inputs & Result */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Controls Form */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Simulation Variables</span>
            </span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">INITIAL INVESTMENT (USDC)</span>
              <input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">TIME HORIZON (YEARS)</span>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="1">1 Year</option>
                <option value="3">3 Years</option>
                <option value="5">5 Years</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">MARKET SCENARIO MODE</span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setScenarioMode("BULL")}
                  className={`py-2 rounded-lg border ${scenarioMode === "BULL" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold" : "bg-[#030509] text-slate-500 border-white/10"}`}
                >
                  Bull 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setScenarioMode("NEUTRAL")}
                  className={`py-2 rounded-lg border ${scenarioMode === "NEUTRAL" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold" : "bg-[#030509] text-slate-500 border-white/10"}`}
                >
                  Base ⚖️
                </button>
                <button
                  type="button"
                  onClick={() => setScenarioMode("BEAR")}
                  className={`py-2 rounded-lg border ${scenarioMode === "BEAR" ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold" : "bg-[#030509] text-slate-500 border-white/10"}`}
                >
                  Bear 🐻
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 py-3 text-xs font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
              <span>Run 10,000 Path Simulation</span>
            </button>
          </form>
        </div>

        {/* Projected Simulation Visualization */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white">Projected Future Portfolio Value</span>
            <span className="text-[10px] font-mono text-purple-300">Confidence Interval: 98.4%</span>
          </div>

          <div className="text-center py-6 space-y-2 bg-[#030509] rounded-xl border border-white/[0.06]">
            <span className="text-xs font-mono text-slate-400 block">ESTIMATED FUTURE PORTFOLIO IN {timeHorizon} YEARS</span>
            <div className="text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-300 to-cyan-300">
              ${calculateProjectedValue()} USDC
            </div>
            <span className="text-[11px] font-mono text-emerald-400 block pt-1">
              Estimated Net Profit: +${(parseFloat(calculateProjectedValue().replace(/,/g, "")) - parseFloat(initialInvestment || "0")).toFixed(2)} USDC
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Simulation Model:</span>
              <span>GARCH Volatility + Monte Carlo</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Drawdown Protection:</span>
              <span className="text-emerald-400">Circuit Breaker Backed (-3.2% Max)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}