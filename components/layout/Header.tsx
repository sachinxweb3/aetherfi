"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Shield, Wallet, X, ArrowRight, AlertCircle, LogOut } from "lucide-react";
import { connectWeb3Wallet } from "@/lib/web3/wallet";

export default function Header() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletState, setWalletState] = useState<{
    address: string;
    balance: string;
    walletType: string;
  } | null>(null);

  const [shieldActive, setShieldMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRealWalletConnect = async (walletType: string) => {
    setConnecting(true);
    setErrorMessage(null);

    try {
      // Pass forcePrompt = true to ensure wallet permission modal pops up
      const data = await connectWeb3Wallet(true);
      setWalletState({
        address: data.address,
        balance: data.balance,
        walletType,
      });
      setIsWalletOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setWalletState(null);
    // Clear browser wallet permissions if available
    if (typeof window !== "undefined" && window.ethereum?.request) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (e) {
        // Fallback
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#02040A]/80 backdrop-blur-xl px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Chain Status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-wide">AETHERFI</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ARC TESTNET (5042002)
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link href="/" className="hover:text-cyan-400 transition-colors">DeFi Terminal</Link>
            <Link href="/" className="hover:text-cyan-400 transition-colors">Prediction Market</Link>
            <Link href="/" className="hover:text-cyan-400 transition-colors">ZK Vault</Link>
            <Link href="/" className="hover:text-cyan-400 transition-colors">Docs & Whitepaper</Link>
            <a href="https://arc.network" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors text-slate-400">Arc Ecosystem ↗</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Shield Toggle */}
            <button
              onClick={() => setShieldMode(!shieldActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                shieldActive 
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" 
                  : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{shieldActive ? "Shield On" : "Shield Mode"}</span>
            </button>

            {/* Wallet Button */}
            {walletState ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-mono text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    {walletState.address.substring(0, 6)}...{walletState.address.substring(walletState.address.length - 4)}
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded ml-1">
                    {walletState.balance} USDC
                  </span>
                </div>

                <button
                  onClick={handleDisconnect}
                  title="Disconnect Wallet & Reset Permissions"
                  className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Complete Arc-Compatible Web3 Wallet Modal */}
      {isWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090C15] p-6 shadow-2xl relative space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Connect Web3 Wallet (Arc Native)</h3>
              </div>
              <button
                onClick={() => setIsWalletOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              
              {/* Universal Browser Wallet (Rabby / Zerion / MetaMask) */}
              <button
                onClick={() => handleRealWalletConnect("Browser Extension Wallet")}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">W</div>
                  <div className="text-left">
                    <span className="block">Browser Extension Wallet</span>
                    <span className="text-[10px] text-slate-400 font-normal">Rabby, Zerion, MetaMask, Brave, Trust</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              {/* Rabby Specific Option */}
              <button
                onClick={() => handleRealWalletConnect("Rabby Wallet")}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">R</div>
                  <span>Rabby Wallet</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              {/* Zerion Specific Option */}
              <button
                onClick={() => handleRealWalletConnect("Zerion Wallet")}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">Z</div>
                  <span>Zerion Wallet</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              {/* Coinbase Wallet */}
              <button
                onClick={() => handleRealWalletConnect("Coinbase Wallet")}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-xs font-semibold text-white transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-300 font-bold">C</div>
                  <span>Coinbase Wallet</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

            </div>

            <div className="pt-2 text-center border-t border-white/5">
              <span className="text-[10px] text-slate-500 font-mono">Compatible with all Arc EVM Chains (ID: 5042002)</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}