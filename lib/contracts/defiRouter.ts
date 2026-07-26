import { type PublicClient, formatUnits, parseUnits } from "viem"
import { type ParsedIntent } from "@/lib/ai/intentParser"

export interface DeFiRouteQuote {
  intent: ParsedIntent
  estimatedOutput: string
  minimumReceived: string
  priceImpactPercent: string
  executionRouterAddress: `0x${string}`
  gasEstimateUnits: string
  isExecutable: boolean
}

export const AETHER_ROUTER_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_AETHER_ROUTER_ADDRESS as `0x${string}`) ||
  "0x5040000000000000000000000000000000000002"

/**
 * Queries live RPC gas parameters and computes routing quotes for parsed financial intents.
 */
export async function calculateDeFiRouteQuote(
  publicClient: PublicClient,
  intent: ParsedIntent
): Promise<DeFiRouteQuote> {
  try {
    const inputAmountNum = parseFloat(intent.amount)
    
    // Simulate DEX pool exchange rate calculation (1 ETH = 3,200 USDC benchmark rate)
    let conversionRate = 1 / 3200
    if (intent.sourceToken === "ETH" && intent.targetToken === "USDC") {
      conversionRate = 3200
    }

    const rawOutput = inputAmountNum * conversionRate
    const priceImpact = inputAmountNum > 100000 ? "0.15%" : "0.02%"

    const minReceivedNum = rawOutput * (1 - intent.slippageTolerancePercent / 100)

    const gasPrice = await publicClient.getGasPrice()
    const swapGasLimit = BigInt(180000)
    const totalGasFeeWei = gasPrice * swapGasLimit

    return {
      intent,
      estimatedOutput: rawOutput.toFixed(6),
      minimumReceived: minReceivedNum.toFixed(6),
      priceImpactPercent: priceImpact,
      executionRouterAddress: AETHER_ROUTER_ADDRESS,
      gasEstimateUnits: swapGasLimit.toString(),
      isExecutable: true,
    }
  } catch (error) {
    console.error("Error computing DeFi route quote:", error)
    return {
      intent,
      estimatedOutput: "0.000000",
      minimumReceived: "0.000000",
      priceImpactPercent: "0.00%",
      executionRouterAddress: AETHER_ROUTER_ADDRESS,
      gasEstimateUnits: "0",
      isExecutable: false,
    }
  }
}