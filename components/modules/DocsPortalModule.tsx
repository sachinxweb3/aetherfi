"use client";

import React, { useState } from "react";
import { BookOpen, Code, Terminal, Copy, Check } from "lucide-react";

export default function DocsPortalModule() {
  const [copied, setCopied] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"overview" | "rpc" | "sdk">("overview");

  const sdkCode = `import { AetherClient } from "@aetherfi/sdk";

const client = new AetherClient({
  chainId: 5042002, // Arc Testnet
  rpcUrl: "https://rpc.testnet.arc.network",
});

// Execute ZK Shielded Swap
const tx = await client.zkSwap({
  fromToken: "USDC",
  toToken: "ETH",
  amount: "500",
  stealth: true,
});
console.log("Tx Hash:", tx.hash);`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sdkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#090C15] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Interactive Live Documentation & Whitepaper</span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  v2.4 Technical Specs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete developer guides, SDK integration code snippets, and Arc Chain RPC specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#030509] p-1 rounded-xl border border-white/10 font-mono text-xs">
            <button
              onClick={() => setActiveDocTab("overview")}
              className={`px-3 py-1.5 rounded-lg ${activeDocTab === "overview" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveDocTab("rpc")}
              className={`px-3 py-1.5 rounded-lg ${activeDocTab === "rpc" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400"}`}
            >
              RPC Config
            </button>
            <button
              onClick={() => setActiveDocTab("sdk")}
              className={`px-3 py-1.5 rounded-lg ${activeDocTab === "sdk" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400"}`}
            >
              SDK Playground
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-6 space-y-4 font-mono text-xs">
        {activeDocTab === "overview" && (
          <div className="space-y-3 leading-relaxed text-slate-300">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>AetherFI OS Architecture Whitepaper</span>
            </h3>
            <p>
              AetherFI operates as an agentic layer built on top of the Arc EVM ecosystem. By utilizing native USDC gas settlement, users avoid token volatility friction while performing high-speed intent-driven swaps and ZK-privacy stealth transfers.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-500 block font-bold">ZK CRYPTOGRAPHY</span>
                <span className="text-emerald-400 font-bold">Lattice-Based CRYSTALS-Kyber</span>
              </div>
              <div className="p-3 rounded-xl bg-[#030509] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-500 block font-bold">CONSENSUS SPEED</span>
                <span className="text-cyan-400 font-bold">0.25s Block Finality</span>
              </div>
            </div>
          </div>
        )}

        {activeDocTab === "rpc" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="h-4 w-4 text-purple-400" />
              <span>Arc Testnet Network Connection RPC</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#030509] border border-white/[0.06] space-y-2 text-slate-300">
              <div><span className="text-slate-500">Network Name:</span> Arc Testnet</div>
              <div><span className="text-slate-500">RPC Endpoint:</span> <span className="text-cyan-300">https://rpc.testnet.arc.network</span></div>
              <div><span className="text-slate-500">Chain ID (Hex):</span> <span className="text-emerald-300">0x4cef52</span> (5042002 Decimal)</div>
              <div><span className="text-slate-500">Currency Symbol:</span> USDC (Native Gas)</div>
              <div><span className="text-slate-500">Block Explorer:</span> https://testnet.arcscan.app</div>
            </div>
          </div>
        )}

        {activeDocTab === "sdk" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-400" />
                <span>@aetherfi/sdk TypeScript Code Snippet</span>
              </h3>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 text-[11px]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#030509] border border-white/[0.06] text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
              {sdkCode}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}