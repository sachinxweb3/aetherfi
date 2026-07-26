"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Zap,
  KeyRound,
} from "lucide-react";

export default function ZkVaultModule() {
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [inputPin, setInputPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passError, setPassError] = useState(false);
  const [stealthAddr, setStealthAddr] = useState("0xzk_stealth_894230fa9021");
  const [isGenerating, setIsGenerating] = useState(false);

  // Initial Vault Setup (Set Custom Password)
  const handleSetInitialPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.length === 4) {
      setSavedPin(inputPin);
      setIsUnlocked(true);
      setInputPin("");
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  // Unlock with user password
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === savedPin) {
      setIsUnlocked(true);
      setPassError(false);
      setInputPin("");
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 1500);
    }
  };

  const handleGenerateNewStealth = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomHex = Math.random().toString(36).substring(2, 10);
      setStealthAddr(`0xzk_stealth_${randomHex}89a`);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Zero-Knowledge Stealth Vault</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Lattice ZK-v4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted multi-asset privacy ledger backed by Arc Chain zero-knowledge proofs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              isUnlocked 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}>
              {isUnlocked ? "UNLOCKED / DECRYPTED" : "ENCRYPTED / ANONYMOUS"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Lock / Setup Panel */}
      {!isUnlocked ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-8 text-center space-y-5 max-w-md mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto">
            {savedPin ? <Lock className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {savedPin ? "Enter Your Master Passcode" : "Create Vault Master Passcode"}
            </h3>
            <p className="text-xs text-slate-400">
              {savedPin 
                ? "Enter your secret 4-digit PIN to decrypt stealth transactions." 
                : "Set a custom 4-digit PIN to secure your zero-knowledge vault."}
            </p>
          </div>

          <form onSubmit={savedPin ? handleUnlock : handleSetInitialPin} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              placeholder="••••"
              className={`w-40 text-center tracking-widest text-lg font-mono rounded-xl border bg-[#030509] py-2.5 text-white focus:outline-none transition-all ${
                passError ? "border-red-500 ring-2 ring-red-500/20" : "border-white/10 focus:border-indigo-500/50"
              }`}
            />

            {passError && (
              <p className="text-xs text-red-400 font-mono">
                {savedPin ? "Incorrect PIN!" : "PIN must be exactly 4 digits"}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Unlock className="h-4 w-4" />
              <span>{savedPin ? "Authenticate & Decrypt" : "Set Custom Password & Unlock"}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Stealth Address & Controls */}
          <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-cyan-400" />
                <span>Stealth Key</span>
              </span>
              <button
                onClick={() => setIsUnlocked(false)}
                className="text-[10px] text-slate-400 hover:text-white bg-white/[0.05] px-2 py-1 rounded-lg border border-white/10"
              >
                Lock Vault
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] break-all text-cyan-300">
                {stealthAddr}
              </div>

              <button
                onClick={handleGenerateNewStealth}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 py-2 text-[11px] font-medium text-slate-300 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                <span>Generate New Stealth Address</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Shielded Balances</span>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">USDC Shielded:</span>
                <span className="text-emerald-400 font-bold">$12,450.00</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">ETH Shielded:</span>
                <span className="text-cyan-400 font-bold">3.45 ETH</span>
              </div>
            </div>
          </div>

          {/* Encrypted On-Chain Ledger */}
          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-400" />
                <span>Decrypted Stealth Activity</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Arc Mainnet Relay Active</span>
            </div>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden font-mono text-xs">
              <div className="bg-[#030509] p-3 text-slate-500 text-[10px] border-b border-white/[0.06] grid grid-cols-4">
                <span>TYPE</span>
                <span>AMOUNT</span>
                <span>PROOF HASH</span>
                <span className="text-right">STATUS</span>
              </div>

              <div className="p-3 border-b border-white/[0.04] grid grid-cols-4 items-center text-[11px]">
                <span className="text-emerald-400 flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Shield Swap</span>
                <span>1,200 USDC</span>
                <span className="text-slate-500">0x9f...a81</span>
                <span className="text-emerald-400 text-right">Verified ✓</span>
              </div>

              <div className="p-3 border-b border-white/[0.04] grid grid-cols-4 items-center text-[11px]">
                <span className="text-cyan-400 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Stealth Transfer</span>
                <span>500 USDC</span>
                <span className="text-slate-500">0x3b...f12</span>
                <span className="text-emerald-400 text-right">Verified ✓</span>
              </div>

              <div className="p-3 grid grid-cols-4 items-center text-[11px]">
                <span className="text-purple-400 flex items-center gap-1"><Zap className="h-3 w-3" /> Yield Deposit</span>
                <span>5,000 USDC</span>
                <span className="text-slate-500">0x1c...e09</span>
                <span className="text-emerald-400 text-right">Active (18.4%)</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}