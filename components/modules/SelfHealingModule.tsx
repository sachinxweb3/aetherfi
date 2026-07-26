"use client";

import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Zap, Activity, AlertTriangle, RefreshCw, Lock } from "lucide-react";

export default function SelfHealingModule() {
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false);
  const [threatScore, setThreatScore] = useState(2); // Low baseline threat (0-100)
  const [isFixing, setIsFixing] = useState(false);

  const [securityEvents, setSecurityEvents] = useState<string[]>([
    "[NORMAL] AI Sentinel verified reentrancy resistance on Arc Core Pools.",
    "[NORMAL] Oracle deviation index within nominal threshold (0.001%).",
    "[NORMAL] Flash loan anomaly scanner reporting zero malicious vectors.",
  ]);

  const handleSimulateExploit = () => {
    setCircuitBreakerTripped(true);
    setThreatScore(94);
    setSecurityEvents((prev) => [
      "[ALERT] Malicious Sandwich / Reentrancy vector detected on Pool #04!",
      "[ACTION] Self-Healing AI Circuit Breaker TRIPPED. Arc Swarm Route Frozen.",
      "[PATCHING] Synthesizing zero-day reentrancy guard patch...",
      ...prev.slice(0, 2),
    ]);
  };

  const handleApplyPatch = () => {
    setIsFixing(true);
    setTimeout(() => {
      setCircuitBreakerTripped(false);
      setThreatScore(3);
      setIsFixing(false);
      setSecurityEvents((prev) => [
        "[RESOLVED] Anti-Exploit Circuit Breaker auto-patched state vector.",
        "[SYSTEM] Normal execution restored on Arc Chain Testnet.",
        ...prev.slice(0, 2),
      ]);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className={`rounded-2xl border p-6 shadow-2xl relative overflow-hidden transition-all ${
        circuitBreakerTripped
          ? "border-red-500/40 bg-red-500/10"
          : "border-cyan-500/30 bg-[#090C15]"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
              circuitBreakerTripped
                ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
            }`}>
              {circuitBreakerTripped ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Self-Healing AI Circuit Breaker</span>
                <span className={`text-[10px] font-mono border px-2 py-0.5 rounded-full ${
                  circuitBreakerTripped
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                }`}>
                  Anti-Exploit Sentinel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous threat detection & zero-day exploit isolation engine for Arc Chain.
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
            circuitBreakerTripped
              ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}>
            {circuitBreakerTripped ? "CIRCUIT BREAKER TRIPPED 🛑" : "SYSTEM SECURE ✓"}
          </span>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Threat Gauge & Controls */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Threat Level Gauge</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Real-time ML</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Anomaly Index:</span>
              <span className={`font-bold ${circuitBreakerTripped ? "text-red-400" : "text-emerald-400"}`}>
                {threatScore} / 100
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  circuitBreakerTripped ? "bg-red-500 w-[94%]" : "bg-emerald-400 w-[4%]"
                }`}
              />
            </div>

            {!circuitBreakerTripped ? (
              <button
                onClick={handleSimulateExploit}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 py-2.5 text-xs font-semibold text-amber-300 transition-all active:scale-95"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Simulate Attack / Exploit</span>
              </button>
            ) : (
              <button
                onClick={handleApplyPatch}
                disabled={isFixing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-semibold text-slate-950 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFixing ? "animate-spin" : ""}`} />
                <span>{isFixing ? "Applying AI Patch..." : "Trigger AI Auto-Patch"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Telemetry Logs */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>AI Security Event Telemetry</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Arc Anti-Exploit Active</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#030509] p-3 font-mono text-xs space-y-2 h-36 overflow-hidden">
            {securityEvents.map((event, idx) => (
              <p
                key={idx}
                className={`truncate ${
                  event.includes("ALERT") || event.includes("TRIPPED")
                    ? "text-red-400 font-bold"
                    : event.includes("RESOLVED")
                    ? "text-emerald-400 font-bold"
                    : "text-slate-300"
                }`}
              >
                {event}
              </p>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 font-mono flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Circuit Breaker continuously protects pooled liquidity against flash loan exploits.</span>
          </div>
        </div>

      </div>

    </div>
  );
}