"use client";

import React, { useState } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Sliders, CheckCircle2 } from "lucide-react";

export default function SpatialTerminalModule() {
  const [selectedPair, setSelectedPair] = useState("ETH/USDC");
  const [price, setPrice] = useState(3571.40);
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [limitPrice, setLimitPrice] = useState("3550.00");
  const [orderAmount, setOrderAmount] = useState("1.5");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#090C15] p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Spatial Web3 Trading Terminal</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Arc Orderbook v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency orderbook trading with zero-slippage limit order execution on Arc Chain.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Active Pair:</span>
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="bg-[#030509] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none"
          >
            <option value="ETH/USDC">ETH / USDC ($3,571.40)</option>
            <option value="ARC/USDC">ARC / USDC ($12.85)</option>
          </select>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Candlestick / Market Depth Visualizer */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-white font-bold">{selectedPair}</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" /> +2.84%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">24h Vol: $42.8M USDC</span>
          </div>

          {/* Simulated Candlestick Chart */}
          <div className="h-44 rounded-xl bg-[#030509] border border-white/[0.06] p-4 flex items-end justify-between gap-2 relative">
            <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-500">Live Arc Orderbook Feed</div>
            <div className="w-full bg-emerald-500/30 h-[45%] rounded-t" />
            <div className="w-full bg-emerald-500/40 h-[65%] rounded-t" />
            <div className="w-full bg-red-500/30 h-[35%] rounded-t" />
            <div className="w-full bg-emerald-500/50 h-[85%] rounded-t" />
            <div className="w-full bg-emerald-500/60 h-[95%] rounded-t" />
            <div className="w-full bg-red-500/40 h-[50%] rounded-t" />
            <div className="w-full bg-emerald-500/70 h-[75%] rounded-t" />
          </div>

          {/* Orderbook Depth Stream */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-emerald-400 block font-bold">BID ORDERBOOK (BUY)</span>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$3,570.80</span>
                <span>4.25 ETH</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$3,570.00</span>
                <span>12.80 ETH</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-red-400 block font-bold">ASK ORDERBOOK (SELL)</span>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$3,572.00</span>
                <span>2.10 ETH</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$3,572.50</span>
                <span>8.40 ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Execution Form */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Place Trade</span>
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setOrderType("LIMIT")}
                className={`px-2 py-0.5 rounded ${orderType === "LIMIT" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}
              >
                Limit
              </button>
              <button
                type="button"
                onClick={() => setOrderType("MARKET")}
                className={`px-2 py-0.5 rounded ${orderType === "MARKET" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}
              >
                Market
              </button>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-3 font-mono text-xs">
            {orderType === "LIMIT" && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500">LIMIT PRICE (USDC)</span>
                <input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500">AMOUNT (ETH)</span>
              <input
                type="text"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="text-white font-bold">
                  ${(parseFloat(orderAmount || "0") * parseFloat(limitPrice || "3571")).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span>Arc Gas Fee:</span>
                <span className="text-cyan-400">0.0001 USDC Native</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 py-3 text-xs font-bold text-slate-950 transition-all shadow-lg active:scale-95"
            >
              Place Limit Buy Order
            </button>
          </form>

          {orderPlaced && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Limit order submitted to Arc Orderbook!</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}