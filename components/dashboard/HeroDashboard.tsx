"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  TrendingUp,
  Terminal,
  RefreshCw,
  Command,
  Activity,
  Sliders,
  Zap,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Shield,
  ShieldAlert,
  Award,
  Bot,
  Server,
  BarChart2,
  Building2,
  BookOpen,
  DollarSign,
} from "lucide-react";

import ZkVaultModule from "@/components/modules/ZkVaultModule";
import ArcSwapModule from "@/components/modules/ArcSwapModule";
import PostQuantumModule from "@/components/modules/PostQuantumModule";
import SelfHealingModule from "@/components/modules/SelfHealingModule";
import ZkCreditScoringModule from "@/components/modules/ZkCreditScoringModule";
import AiSwarmsModule from "@/components/modules/AiSwarmsModule";
import SpatialTerminalModule from "@/components/modules/SpatialTerminalModule";
import PredictionMarketModule from "@/components/modules/PredictionMarketModule";
import DepinStakingModule from "@/components/modules/DepinStakingModule";
import FinancialTimeMachineModule from "@/components/modules/FinancialTimeMachineModule";
import MicroInsuranceModule from "@/components/modules/MicroInsuranceModule";
import SpatialNftMarketplaceModule from "@/components/modules/SpatialNftMarketplaceModule";
import RwaVaultsModule from "@/components/modules/RwaVaultsModule";
import DocsPortalModule from "@/components/modules/DocsPortalModule";
import VcPitchDeckModule from "@/components/modules/VcPitchDeckModule";
import { executeArcOnChainTx } from "@/lib/web3/contracts";

export default function HeroDashboard() {
  const [activeTab, setActiveTab] = useState<
    "copilot" | "swarms" | "docs" | "vcpitch" | "spatialnft" | "rwa" | "depin" | "timemachine" | "insurance" | "terminal" | "prediction" | "vault" | "dex" | "quantum" | "circuit" | "credit"
  >("copilot");

  const [intent, setIntent] = useState("Stake 1000 USDC in Arc Yield Vault at 18.4% APY");
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResult, setExecutionResult] = useState<null | {
    route: string;
    gas: string;
    yield: string;
    txHash?: string;
    explorerUrl?: string;
  }>(null);

  const [txError, setTxError] = useState<string | null>(null);

  const [logs, setLogs] = useState<string[]>([
    "[0.01s] AI Swarm #04 verified zero-slippage route",
    "[0.03s] Arc Block #5042730 Mined (USDC Gas: 0.0001)",
    "[0.08s] ZK Stealth Proof generated for 0x7a...912",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sampleLogs = [
        `[${(Math.random() * 0.08).toFixed(2)}s] AI Swarm #04 verified zero-slippage route`,
        `[${(Math.random() * 0.08).toFixed(2)}s] Arc Block #5042730 Mined (USDC Gas: 0.0001)`,
        `[${(Math.random() * 0.08).toFixed(2)}s] ZK Stealth Proof generated for 0x7a...912`,
        `[${(Math.random() * 0.08).toFixed(2)}s] Prediction Odds re-balanced (78% YES)`,
      ];
      const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      setLogs((prev) => [randomLog, ...prev.slice(0, 2)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleIntentExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent) return;
    setIsSimulating(true);
    setExecutionResult(null);
    setTxError(null);

    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: intent }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error("Failed to synthesize intent route.");
      }

      const synthesized = data.synthesizedIntent;

      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];

        if (accounts && accounts.length > 0) {
          const txRes = await executeArcOnChainTx(
            accounts[0],
            synthesized.targetContract,
            synthesized.parsedAmount
          );

          setExecutionResult({
            route: synthesized.route,
            gas: synthesized.gasEstimate,
            yield: synthesized.netMetric,
            txHash: txRes.hash,
            explorerUrl: txRes.explorerUrl,
          });
          return;
        }
      }

      setExecutionResult({
        route: synthesized.route,
        gas: synthesized.gasEstimate,
        yield: synthesized.netMetric,
      });

    } catch (err: any) {
      setTxError(err?.message || "Execution cancelled or failed.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-[#02040A] text-slate-100 overflow-hidden pt-4 pb-20">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        {/* Status Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-10 text-[11px] font-mono text-slate-400 overflow-x-auto gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-200 font-semibold tracking-wider uppercase">ARC CHAIN OPERATIONAL</span>
          </div>
          <div className="flex items-center gap-6 shrink-0 text-slate-400">
            <span>CHAIN ID: <strong className="text-cyan-400 font-normal">5042730</strong></span>
            <span>SETTLEMENT: <strong className="text-emerald-400 font-normal">USDC NATIVE</strong></span>
            <span>AVG GAS: <strong className="text-cyan-400 font-normal">0.0001 USDC</strong></span>
            <span>BLOCK TIME: <strong className="text-indigo-400 font-normal">0.25s</strong></span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3.5 py-1 text-[11px] font-medium text-cyan-300">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Next-Gen Agentic Financial OS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Autonomous Matrix for <br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              DeFi ZK-Privacy & AI Swarms
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
            Zero-knowledge shielded transactions, intent-driven AI executions, and high-speed prediction markets on Arc Chain.
          </p>
        </div>

        {/* Master Command Navigation Dock - Complete Enterprise Hub */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#080B12] p-1.5 backdrop-blur-2xl max-w-5xl">
            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "copilot"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "docs"
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-400/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Docs & SDK</span>
            </button>

            <button
              onClick={() => setActiveTab("vcpitch")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "vcpitch"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>VC Pitch Deck</span>
            </button>

            <button
              onClick={() => setActiveTab("swarms")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "swarms"
                  ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-slate-950 font-bold shadow-lg shadow-cyan-400/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>AI Swarms</span>
            </button>

            <button
              onClick={() => setActiveTab("spatialnft")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "spatialnft"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Spatial NFT</span>
            </button>

            <button
              onClick={() => setActiveTab("rwa")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "rwa"
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-400/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>RWA Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab("depin")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "depin"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>DePIN GPU</span>
            </button>

            <button
              onClick={() => setActiveTab("timemachine")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "timemachine"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Time Machine</span>
            </button>

            <button
              onClick={() => setActiveTab("insurance")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "insurance"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Insurance</span>
            </button>

            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "terminal"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Trading</span>
            </button>

            <button
              onClick={() => setActiveTab("prediction")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "prediction"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Prediction</span>
            </button>

            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "vault"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ZK Vault</span>
            </button>

            <button
              onClick={() => setActiveTab("quantum")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "quantum"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Post-Quantum</span>
            </button>

            <button
              onClick={() => setActiveTab("circuit")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "circuit"
                  ? "bg-gradient-to-r from-red-500 to-amber-600 text-white shadow-lg shadow-red-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Circuit Breaker</span>
            </button>

            <button
              onClick={() => setActiveTab("credit")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "credit"
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-600 text-slate-950 font-bold shadow-lg shadow-emerald-400/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>ZK Credit</span>
            </button>
          </div>
        </div>

        {/* Active Command Window */}
        <div className="w-full mb-12">
          <AnimatePresence mode="wait">
            {activeTab === "copilot" && (
              <motion.div
                key="copilot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto rounded-2xl border border-cyan-500/20 bg-[#090C15] p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 tracking-wider">
                    <Command className="h-3.5 w-3.5" />
                    <span>NATURAL LANGUAGE INTENT CO-PILOT</span>
                  </div>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-mono">
                    Model: AetherFI-LLM v2.4
                  </span>
                </div>

                <form onSubmit={handleIntentExecute} className="space-y-4">
                  <textarea
                    rows={3}
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="Type intent e.g., Stake 1000 USDC in Arc Yield Vault at 18.4% APY"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#04060A] p-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all resize-none leading-relaxed"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIntent("Swap 500 USDC to ETH with 0.01% max slippage")}
                        className="text-[11px] font-mono bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 border border-white/[0.08] rounded-lg px-2.5 py-1.5 transition-all"
                      >
                        + Auto Swap USDC/ETH
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntent("Stake 1000 USDC in Arc Yield Vault at 18.4% APY")}
                        className="text-[11px] font-mono bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 border border-white/[0.08] rounded-lg px-2.5 py-1.5 transition-all"
                      >
                        + Stake in Yield Vault
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSimulating}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Parsing & Signing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Execute Intent</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {txError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-mono text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{txError}</span>
                  </div>
                )}

                {executionResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-mono text-xs space-y-2 text-emerald-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>INTENT EXECUTED ON ARC TESTNET</span>
                      </div>
                      {executionResult.explorerUrl && (
                        <a
                          href={executionResult.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                        >
                          View Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                      <div><span className="text-slate-500">Route:</span> {executionResult.route}</div>
                      <div><span className="text-slate-500">Estimated Gas:</span> {executionResult.gas}</div>
                      <div><span className="text-slate-500">Yield Metric:</span> {executionResult.yield}</div>
                      {executionResult.txHash && (
                        <div className="col-span-2 text-cyan-300 truncate">
                          <span className="text-slate-500">Tx Hash:</span> {executionResult.txHash}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 📚 Docs Module */}
            {activeTab === "docs" && (
              <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DocsPortalModule />
              </motion.div>
            )}

            {/* 📊 VC Pitch Deck Module */}
            {activeTab === "vcpitch" && (
              <motion.div key="vcpitch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <VcPitchDeckModule />
              </motion.div>
            )}

            {/* 🤖 AI Swarms Module */}
            {activeTab === "swarms" && (
              <motion.div key="swarms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AiSwarmsModule />
              </motion.div>
            )}

            {/* 🌌 Spatial NFT Module */}
            {activeTab === "spatialnft" && (
              <motion.div key="spatialnft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SpatialNftMarketplaceModule />
              </motion.div>
            )}

            {/* 🏢 RWA Vaults Module */}
            {activeTab === "rwa" && (
              <motion.div key="rwa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <RwaVaultsModule />
              </motion.div>
            )}

            {/* 🖥️ DePIN GPU Staking Module */}
            {activeTab === "depin" && (
              <motion.div key="depin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DepinStakingModule />
              </motion.div>
            )}

            {/* ⏳ Financial Time Machine Module */}
            {activeTab === "timemachine" && (
              <motion.div key="timemachine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <FinancialTimeMachineModule />
              </motion.div>
            )}

            {/* 🛡️ Micro-Insurance Module */}
            {activeTab === "insurance" && (
              <motion.div key="insurance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <MicroInsuranceModule />
              </motion.div>
            )}

            {/* 📈 Trading Terminal Module */}
            {activeTab === "terminal" && (
              <motion.div key="terminal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SpatialTerminalModule />
              </motion.div>
            )}

            {/* 🎯 Prediction Market Module */}
            {activeTab === "prediction" && (
              <motion.div key="prediction" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PredictionMarketModule />
              </motion.div>
            )}

            {/* 🔐 ZK Vault Module */}
            {activeTab === "vault" && (
              <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ZkVaultModule />
              </motion.div>
            )}

            {/* 📈 Arc Swap Module */}
            {activeTab === "dex" && (
              <motion.div key="dex" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ArcSwapModule />
              </motion.div>
            )}

            {/* 🛡️ Post-Quantum Lattice Module */}
            {activeTab === "quantum" && (
              <motion.div key="quantum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PostQuantumModule />
              </motion.div>
            )}

            {/* 🚨 AI Circuit Breaker Module */}
            {activeTab === "circuit" && (
              <motion.div key="circuit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SelfHealingModule />
              </motion.div>
            )}

            {/* 🎖️ ZK Credit Scoring Engine Module */}
            {activeTab === "credit" && (
              <motion.div key="credit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ZkCreditScoringModule />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3 Grid Streams */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          
          <div className="rounded-2xl border border-white/[0.08] bg-[#090C15]/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-white">AI Swarm Live Stream</h4>
            </div>

            <div className="rounded-xl bg-[#04060A] p-3 border border-white/[0.06] font-mono text-[11px] text-slate-400 space-y-2 h-32 overflow-hidden">
              {logs.map((log, idx) => (
                <p key={idx} className="text-cyan-300/80 truncate">
                  {log}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090C15]/80 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Prediction Market</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Live Odds</span>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-3">Will ETH surpass $4,500 before Q4?</p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>YES (78% Probability)</span>
                <span className="text-emerald-400">1.28x Payout</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-[78%]" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090C15]/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sliders className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-white">VC Ecosystem Shield</h4>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Security Audit:</span>
                <span className="text-emerald-400">✓ 100% Passed</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Gas Engine:</span>
                <span className="text-cyan-400">Native USDC</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Quantum Proof:</span>
                <span className="text-indigo-400">Lattice-Based ZK</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}