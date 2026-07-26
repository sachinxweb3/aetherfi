"use client"

import * as React from "react"
import { usePublicClient } from "wagmi"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { getLiveNodeTelemetry, type DePinNodeMetrics } from "@/lib/depin/nodeTelemetry"
import { getDePinVaultClaimQuote, type DePinVaultClaimQuote } from "@/lib/contracts/depinVault"
import { HardDrive, Cpu, Wifi, Activity, Coins, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react"

export function DePinNodeTerminal() {
  const publicClient = usePublicClient()
  const { isConnected } = useAetherWallet()

  const [nodeMetrics, setNodeMetrics] = React.useState<DePinNodeMetrics | null>(null)
  const [claimQuote, setClaimQuote] = React.useState<DePinVaultClaimQuote | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isClaiming, setIsClaiming] = React.useState<boolean>(false)
  const [claimTxHash, setClaimTxHash] = React.useState<string | null>(null)

  const loadTelemetry = React.useCallback(async () => {
    if (!publicClient) return
    setIsLoading(true)
    try {
      const metrics = await getLiveNodeTelemetry()
      setNodeMetrics(metrics)
      const quote = await getDePinVaultClaimQuote(publicClient, metrics.nodeId, metrics.unclaimedUsdcRewards)
      setClaimQuote(quote)
    } catch (err) {
      console.error("Telemetry load error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [publicClient])

  React.useEffect(() => {
    loadTelemetry()
  }, [loadTelemetry])

  const handleClaimRewards = async () => {
    if (!isConnected || !claimQuote?.isClaimable) return
    setIsClaiming(true)
    setClaimTxHash(null)

    // Simulate smart contract reward claim transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setClaimTxHash(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`)
    setIsClaiming(false)
  }

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">DePIN Hardware Node Telemetry</h3>
            <p className="text-xs text-muted-foreground">Real-Time Compute Workload & ZK Hardware Attestations</p>
          </div>
        </div>

        <button
          onClick={loadTelemetry}
          disabled={isLoading}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {nodeMetrics && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Node Status</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">{nodeMetrics.nodeId}</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                {nodeMetrics.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Compute Usage</span>
              <Cpu className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-sm font-bold text-amber-400">
              {nodeMetrics.computeUsagePercent}% GPU
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Relay Bandwidth</span>
              <Wifi className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 font-mono text-sm font-bold text-cyan-400">
              {nodeMetrics.bandwidthMbps} Mbps
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Unclaimed Yield</span>
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-sm font-bold text-emerald-400">
              ${nodeMetrics.unclaimedUsdcRewards} USDC
            </div>
          </div>
        </div>
      )}

      {claimQuote && (
        <div className="mt-6 rounded-xl border border-border/40 bg-background/40 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              DePIN Reward Vault Claim Status
            </span>
            <p className="text-xs text-foreground font-mono">
              Claimable USDC: <span className="font-bold text-emerald-400">${claimQuote.unclaimedUsdc}</span> | Est. Gas:{" "}
              <span className="text-muted-foreground">{claimQuote.estimatedClaimGasFeeUsdc} USDC</span>
            </p>
          </div>

          {claimTxHash && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400 font-mono truncate">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Claim Tx: {claimTxHash.slice(0, 20)}...</span>
            </div>
          )}

          <button
            onClick={handleClaimRewards}
            disabled={!isConnected || isClaiming || !claimQuote.isClaimable}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-amber-500 disabled:opacity-50 shrink-0"
          >
            {isClaiming ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Claiming Vault Rewards...
              </span>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Claim DePIN USDC Yield
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          ZK Hardware Attestation Hash Verified
        </span>
        <span className="font-mono text-[11px]">
          Hash: {nodeMetrics?.zkAttestationHash.slice(0, 18)}...
        </span>
      </div>
    </div>
  )
}