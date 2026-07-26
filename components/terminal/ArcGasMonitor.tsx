"use client"

import * as React from "react"
import { usePublicClient } from "wagmi"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { getArcGasPriceQuote, estimateLayerZeroRelayFee, type ArcGasQuote, type LayerZeroBridgeQuote } from "@/lib/contracts/arcGasEngine"
import { Zap, Layers, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react"

export function ArcGasMonitor() {
  const publicClient = usePublicClient()
  const { chainId, chainName, isConnected } = useAetherWallet()

  const [gasQuote, setGasQuote] = React.useState<ArcGasQuote | null>(null)
  const [lzQuote, setLzQuote] = React.useState<LayerZeroBridgeQuote | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchLiveMetrics = React.useCallback(async () => {
    if (!publicClient) return
    setIsLoading(true)
    setError(null)

    try {
      const quote = await getArcGasPriceQuote(publicClient)
      const bridge = await estimateLayerZeroRelayFee(publicClient, 1)
      setGasQuote(quote)
      setLzQuote(bridge)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch RPC metrics.")
    } finally {
      setIsLoading(false)
    }
  }, [publicClient])

  React.useEffect(() => {
    fetchLiveMetrics()
  }, [fetchLiveMetrics, chainId])

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Arc Chain Gas Engine</h3>
            <p className="text-xs text-muted-foreground">Native USDC Gas Router & LayerZero Bridge Relay</p>
          </div>
        </div>

        <button
          onClick={fetchLiveMetrics}
          disabled={isLoading || !publicClient}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh RPC
        </button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <span className="text-xs font-medium text-muted-foreground">Connected Chain</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">
                {isConnected ? chainName || `Chain ID ${chainId}` : "Not Connected"}
              </span>
              {chainId === 5042002 && (
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                  Native Arc
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <span className="text-xs font-medium text-muted-foreground">Gas Price / Est. USDC Tx Fee</span>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {gasQuote ? `${gasQuote.gasPriceGwei} Gwei (~${gasQuote.usdcGasFeeFormatted} USDC)` : "Querying..."}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <span className="text-xs font-medium text-muted-foreground">LayerZero Relay Status</span>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>{lzQuote?.relayReady ? `Ready (~${lzQuote.estimatedNativeFee} Gas)` : "Offline"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Zero-Slippage Native Gas Routing Active
        </span>
        <span className="font-mono text-[11px]">RPC: Viem Client Active</span>
      </div>
    </div>
  )
}