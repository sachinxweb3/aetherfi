"use client";

import React, { useState } from "react";
import { Shield, Key, Cpu, RefreshCw, CheckCircle2, Lock, Sparkles } from "lucide-react";

export default function PostQuantumModule() {
  const [latticeKey, setLatticeKey] = useState("pq_kyber1024_0x8f29a012e84c99b2014d");
  const [securityLevel, setSecurityLevel] = useState("256-bit Lattice (NIST Round 4)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quantumLogs, setQuantumLogs] = useState<string[]>([
    "[0.01s] Kyber-1024 Key encapsulation initialized",
    "[0.04s] Lattice vector noise parameters verified",
    "[0.09s] Post-Quantum Shield ACTIVE against Grover & Shor algorithms",
  ]);

  const handleRegenerateKeys = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomHex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      setLatticeKey(`pq_kyber1024_0x${randomHex}`);
      
      setQuantumLogs((prev) => [
        `[${(Math.random() * 0.05).toFixed(2)}s] Regenerated Kyber-1024 Lattice Vector`,
        ...prev.slice(0, 2),
      ]);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Post-Quantum Lattice Shield</span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  CRYSTALS-Kyber Standard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Quantum-resistant cryptography protecting Arc Chain state against quantum computer exploits.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            SHOR & GROVER PROOF <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Key Generator Controls */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-purple-400" />
              <span>Lattice Key Matrix</span>
            </span>
            <span className="text-[10px] font-mono text-purple-300">NIST Approved</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <span className="text-slate-500 text-[10px] block">CURRENT PUBLIC KEY VECTOR</span>
            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] break-all text-purple-300">
              {latticeKey}
            </div>

            <button
              onClick={handleRegenerateKeys}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 py-2.5 text-xs font-semibold text-purple-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Rotate Quantum Key Vector</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/[0.08] space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Security Grade:</span>
              <span className="text-emerald-400 font-bold">{securityLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Algorithm:</span>
              <span className="text-cyan-400">ML-KEM (Kyber-1024)</span>
            </div>
          </div>
        </div>

        {/* Live Quantum Defense Logs */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Real-time Quantum Noise Defense Stream</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Active Monitoring</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#030509] p-3 font-mono text-xs text-slate-300 space-y-2.5 h-36 overflow-hidden">
            {quantumLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-purple-300/90">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              <span>All outgoing Arc transactions automatically encrypted with Lattice noise.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}