"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";

export default function MicroInsuranceModule() {
  const [coverageAmount, setCoverageAmount] = useState("50000");
  const [policyActive, setPolicyActive] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Embedded Cross-Chain Micro-Insurance Vaults</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  DeFi Cover v1.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Instant smart contract exploit, depeg, and impermanent loss micro-insurance backed by Arc Chain solvency pools.
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
            policyActive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border border-white/10"
          }`}>
            {policyActive ? (
              <span className="inline-flex items-center gap-1">INSURANCE COVERAGE ACTIVE <CheckCircle2 className="h-3 w-3" aria-hidden="true" /></span>
            ) : "NO ACTIVE POLICY"}
          </span>
        </div>
      </div>

      {/* Insurance Plan Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <span className="text-xs font-bold text-white block">Smart Contract Hack Protection</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Covers 100% of deposited funds in case of protocol zero-day exploit or smart contract logic vulnerability.
          </p>
          <div className="pt-2 font-mono text-xs text-cyan-400 font-bold">Premium: 0.12% / Year</div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <span className="text-xs font-bold text-white block">USDC Native Depeg Shield</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Automatically pays out 1:1 if native USDC price drops below $0.98 for more than 15 consecutive minutes.
          </p>
          <div className="pt-2 font-mono text-xs text-emerald-400 font-bold">Premium: 0.05% / Year</div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Activate Full Vault Policy</span>
            <div className="mt-3 space-y-1 font-mono text-xs">
              <span className="text-[10px] text-slate-500 block">COVERAGE AMOUNT (USDC)</span>
              <input
                type="number"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
                className="w-full bg-[#030509] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setPolicyActive(!policyActive)}
            className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 py-3 text-xs font-bold text-white transition-all shadow-lg active:scale-95"
          >
            {policyActive ? "Cancel Insurance Cover" : "Activate $50,000 Micro-Insurance"}
          </button>
        </div>

      </div>

      {policyActive && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Micro-Insurance Policy #0x918f ACTIVE. ${parseFloat(coverageAmount).toLocaleString()} USDC protected by Arc Solvency Pool.</span>
        </div>
      )}

    </div>
  );
}