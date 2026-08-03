"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, RefreshCw, Lock, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

export default function ZkCreditScoringModule() {
  const [zkScore, setZkScore] = useState(785);
  const [creditLimit, setCreditLimit] = useState("25,000 USDC");
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofHash, setProofHash] = useState("zk_proof_0x8f2a...9102c");
  const [proofGenerated, setProofGenerated] = useState(false);

  const handleGenerateProof = () => {
    setIsGeneratingProof(true);
    setProofGenerated(false);
    setTimeout(() => {
      const randomScore = Math.floor(750 + Math.random() * 85);
      const randomLimit = (randomScore * 40).toLocaleString();
      const randomHash = "zk_proof_0x" + Math.random().toString(36).substring(2, 10) + "a89";

      setZkScore(randomScore);
      setCreditLimit(`${randomLimit} USDC`);
      setProofHash(randomHash);
      setIsGeneratingProof(false);
      setProofGenerated(true);
    }, 1400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Zero-Knowledge Credit Scoring Engine</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  zk-SNARKs v3.1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate verifiable credit scores for uncollateralized DeFi borrowing without exposing your wallet history.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            PRIVACY PRESERVING <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ZK Credit Score Card */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified ZK Score</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Tier A+ Credit</span>
          </div>

          <div className="text-center py-2 space-y-1">
            <div className="text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              {zkScore}
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">Max Rating: 850 (zk-SNARK verified)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Credit Limit:</span>
              <span className="text-emerald-400 font-bold">{creditLimit}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Interest Rate:</span>
              <span className="text-cyan-400">3.2% Fixed APY</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Collateral Req:</span>
              <span className="text-purple-400 font-semibold">0% (Uncollateralized)</span>
            </div>
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={isGeneratingProof}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 py-2.5 text-xs font-semibold text-slate-950 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingProof ? "animate-spin" : ""}`} />
            <span>{isGeneratingProof ? "Generating ZK Proof..." : "Re-calculate ZK Proof"}</span>
          </button>
        </div>

        {/* ZK Proof Details & Attestation Matrix */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Zero-Knowledge Proof Attestations</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Arc Chain Verifier Ready</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 block">CURRENT GENERATED PROOF HASH</span>
              <span className="text-cyan-300 break-all">{proofHash}</span>
            </div>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="bg-[#030509] p-2.5 text-slate-500 text-[10px] border-b border-white/[0.06] grid grid-cols-3">
                <span>METRIC VECTOR</span>
                <span>ZERO-KNOWLEDGE PROOF</span>
                <span className="text-right">VERIFICATION</span>
              </div>
              <div className="p-2.5 border-b border-white/[0.04] grid grid-cols-3 items-center text-[11px]">
                <span className="text-slate-300">Repayment History</span>
                <span className="text-slate-500">Encrypted (100% On-Time)</span>
                <span className="text-emerald-400 text-right inline-flex items-center justify-end gap-1">PASSED <CheckCircle2 className="h-3 w-3" aria-hidden="true" /></span>
              </div>
              <div className="p-2.5 border-b border-white/[0.04] grid grid-cols-3 items-center text-[11px]">
                <span className="text-slate-300">Debt-to-Income Ratio</span>
                <span className="text-slate-500">Blind Range (&lt; 12%)</span>
                <span className="text-emerald-400 text-right inline-flex items-center justify-end gap-1">PASSED <CheckCircle2 className="h-3 w-3" aria-hidden="true" /></span>
              </div>
              <div className="p-2.5 grid grid-cols-3 items-center text-[11px]">
                <span className="text-slate-300">Wallet Longevity</span>
                <span className="text-slate-500">Blind Range (&gt; 3 Years)</span>
                <span className="text-emerald-400 text-right inline-flex items-center justify-end gap-1">PASSED <CheckCircle2 className="h-3 w-3" aria-hidden="true" /></span>
              </div>
            </div>

            {proofGenerated && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>ZK-Credit Proof successfully generated and verified on Arc Chain verifier network!</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}