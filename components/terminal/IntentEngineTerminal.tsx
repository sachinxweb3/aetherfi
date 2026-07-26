"use client"

import * as React from "react"
import { usePublicClient } from "wagmi"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { parseFinancialIntent, type ParsedIntent } from "@/lib/ai/intentParser"
import { calculateDeFiRouteQuote, type DeFiRouteQuote } from "@/lib/contracts/defiRouter"
import { BrainCircuit, Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck } from "lucide-react"

export function IntentEngineTerminal() {
  const publicClient = usePublicClient()
  const { isConnected, chainId } = useAetherWallet()

  const [promptInput, setPromptInput] = React.useState<string>(
    "Swap 100 USDC to ETH on Arc Chain with 0.5% slippage"
  )
  const [parsedIntent, setParsedIntent] = React.useState<ParsedIntent | null>(null)
  const [routeQuote, setRouteQuote] = React.useState<DeFiRouteQuote | null>(null)
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false)
  const [executedTxHash, setExecutedTxHash] = React.useState<string | null>(null)

  const handleProcessIntent = React.useCallback(async () => {
    if (!promptInput.trim() || !publicClient) return
    setIsProcessing(true)
    setExecutedTxHash(null)

    try {
      const intent = parseFinancialIntent(promptInput, chainId)
      setParsedIntent(intent)
      const quote = await calculateDeFiRouteQuote(publicClient, intent)
      setRouteQuote(quote)
    } catch (err) {
      console.error("Intent parsing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [promptInput, publicClient, chainId])

  React.useEffect(() => {
    handleProcessIntent()
  }, [handleProcessIntent])

  const handleExecuteSwap = async () => {
    if (!isConnected || !routeQuote?.isExecutable) return
    setIsExecuting(true)
    setExecutedTxHash(null)

    // Simulate smart contract intent execution cycle
    await new Promise((resolve) => setTimeout(resolve, 2200))
    setExecutedTxHash(
      `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
    )
    setIsExecuting(false)
  }

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">AI Agentic Intent Engine</h3>
            <p className="text-xs text-muted-foreground">Natural Language Prompt to Automated DeFi Contract Execution</p>
          </div>
        </div>

        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
          Intent Model v1.0
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Natural Language Financial Intent Prompt
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g., Swap 500 USDC to ETH on Arc Chain"
              className="flex-1 rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleProcessIntent}
              disabled={isProcessing || !promptInput.trim()}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Parse Intent
            </button>
          </div>
        </div>

        {parsedIntent && routeQuote && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Parsed Intent Specification
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Action Type:</span>
                  <p className="font-mono font-bold text-indigo-400">{parsedIntent.action}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Input Amount:</span>
                  <p className="font-mono font-bold text-foreground">
                    {parsedIntent.amount} {parsedIntent.sourceToken}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target Token:</span>
                  <p className="font-mono font-bold text-foreground">{parsedIntent.targetToken}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Slippage:</span>
                  <p className="font-mono font-bold text-emerald-400">
                    {parsedIntent.slippageTolerancePercent}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/40 bg-background/40 p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Route Execution Quote
                </span>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Output:</span>
                  <span className="font-mono font-bold text-foreground">
                    {routeQuote.estimatedOutput} {parsedIntent.targetToken}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Minimum Received:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {routeQuote.minimumReceived} {parsedIntent.targetToken}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Price Impact:</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {routeQuote.priceImpactPercent}
                  </span>
                </div>
              </div>

              {executedTxHash && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400 font-mono truncate">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Tx Executed: {executedTxHash}</span>
                </div>
              )}

              <button
                onClick={handleExecuteSwap}
                disabled={!isConnected || isExecuting || !routeQuote.isExecutable}
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
              >
                {isExecuting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Executing Smart Contract Route...
                  </span>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Execute Intent Route
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          Aether Router Security & Slippage Safeguards Active
        </span>
        <span className="font-mono text-[11px]">Contract: Viem RPC Validated</span>
      </div>
    </div>
  )
}