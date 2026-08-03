"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Shield, Wallet, AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { connectWeb3Wallet } from "@/lib/web3/wallet";

export default function Header() {
  const [walletState, setWalletState] = useState<{
    address: string;
    balance: string;
  } | null>(null);

  const [shieldActive, setShieldMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Direct trigger: No modal, straight to wallet request
  const handleDirectConnect = async () => {
    setConnecting(true);
    setErrorMessage(null);

    try {
      const data = await connectWeb3Wallet(true);
      setWalletState({
        address: data.address,
        balance: data.balance,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect wallet.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setWalletState(null);
    if (typeof window !== "undefined" && window.ethereum?.request) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (e) {
        // Ignored if provider skips
      }
    }
  };

  return (
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
          
          {/* Error Message Tooltip if connection fails */}
          {errorMessage && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-red-300 animate-fadeIn">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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

          {/* Direct Wallet Button */}
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
                title="Disconnect Wallet"
                className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDirectConnect}
              disabled={connecting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          )}

        </div>

      </div>
    </header>
  );
}