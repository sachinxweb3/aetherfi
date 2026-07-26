"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, RefreshCw, Eye } from "lucide-react";

export default function SpatialNftMarketplaceModule() {
  const [prompt, setPrompt] = useState("Aether Cybernetic Sovereign AI Swarm Core");
  const [isMinting, setIsMinting] = useState(false);
  const [mintedSuccess, setMintedSuccess] = useState(false);

  const [nfts, setNfts] = useState([
    { id: 1, title: "Aether Agent #042", price: "250 USDC", rarity: "Legendary", yield: "+4.2% APY Boost" },
    { id: 2, title: "Quantum Swarm Sentinel", price: "180 USDC", rarity: "Epic", yield: "+2.8% APY Boost" },
    { id: 3, title: "Arc Lattice Core #009", price: "400 USDC", rarity: "Mythic", yield: "+6.5% APY Boost" },
  ]);

  const handleMintNft = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMinting(true);
    setMintedSuccess(false);

    setTimeout(() => {
      setIsMinting(false);
      setMintedSuccess(true);
      const newNft = {
        id: Date.now(),
        title: prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt,
        price: "150 USDC",
        rarity: "Epic",
        yield: "+3.0% APY Boost",
      };
      setNfts([newNft, ...nfts]);
      setTimeout(() => setMintedSuccess(false), 3500);
    }, 1600);
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
                <span>Spatial AI NFT Marketplace & Minter</span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  ERC-721 Arc Native
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mint generative AI Agentic NFTs that grant yield boosts and automated swarm capabilities.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            FLOOR PRICE: 180 USDC
          </span>
        </div>
      </div>

      {/* Generative AI Minter Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Generative AI NFT Prompt Minter</span>
          </span>
          <span className="text-[10px] font-mono text-purple-300">Mint Gas: 0.0001 USDC</span>
        </div>

        <form onSubmit={handleMintNft} className="space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your AI Agent NFT prompt..."
              className="w-full bg-[#030509] border border-white/10 rounded-xl p-3 text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isMinting}
              className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 px-5 py-3 text-xs font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isMinting ? "animate-spin" : ""}`} />
              <span>{isMinting ? "Generating..." : "Mint AI NFT"}</span>
            </button>
          </div>
        </form>

        {mintedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>AI Agent NFT minted successfully onto Arc Chain! View in Spatial Gallery below.</span>
          </div>
        )}
      </div>

      {/* NFT Spatial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <div key={nft.id} className="rounded-2xl border border-white/[0.08] bg-[#080B12] p-4 space-y-3 hover:border-purple-500/40 transition-all">
            <div className="h-32 rounded-xl bg-gradient-to-br from-purple-900/40 via-indigo-900/20 to-slate-900 border border-white/[0.06] flex items-center justify-center relative overflow-hidden">
              <Eye className="h-8 w-8 text-purple-400/60" />
              <span className="absolute top-2 right-2 text-[9px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                {nft.rarity}
              </span>
            </div>

            <div className="space-y-1 font-mono">
              <span className="text-xs font-bold text-white block">{nft.title}</span>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Price:</span>
                <span className="text-emerald-400 font-bold">{nft.price}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Utility:</span>
                <span className="text-cyan-400">{nft.yield}</span>
              </div>
            </div>

            <button className="w-full rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 py-2 text-[11px] font-mono text-slate-200 transition-all">
              Buy Spatial NFT
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}