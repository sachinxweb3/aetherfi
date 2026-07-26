import { type PublicClient, formatUnits, encodeAbiParameters, parseAbiParameters } from "viem"

export interface SupportedCrossChainNetwork {
  id: number
  eid: number
  name: string
  symbol: string
  nativeCurrency: string
}

export const SUPPORTED_NETWORKS: SupportedCrossChainNetwork[] = [
  { id: 5040, eid: 30301, name: "Arc Chain Testnet", symbol: "ARC", nativeCurrency: "USDC" },
  { id: 1, eid: 30101, name: "Ethereum Mainnet", symbol: "ETH", nativeCurrency: "ETH" },
  { id: 42161, eid: 30110, name: "Arbitrum One", symbol: "ARB", nativeCurrency: "ETH" },
  { id: 11155111, eid: 40161, name: "Sepolia Testnet", symbol: "SEP", nativeCurrency: "ETH" },
]

export interface CrossChainQuoteResult {
  sourceChainId: number
  destinationChainId: number
  estimatedNativeFee: string
  estimatedUsdcValue: string
  executionGasLimit: string
  payloadBytes: string
  isRouteAvailable: boolean
}

export async function calculateCrossChainMessagingQuote(
  publicClient: PublicClient,
  sourceChainId: number,
  destinationChainId: number,
  messagePayload: string
): Promise<CrossChainQuoteResult> {
  const destNetwork = SUPPORTED_NETWORKS.find((n) => n.id === destinationChainId)
  
  if (!destNetwork) {
    throw new Error("Unsupported destination chain ID selected.")
  }

  try {
    const gasPrice = await publicClient.getGasPrice()
    const lzGasLimit = BigInt(200000)
    const estimatedFeeWei = gasPrice * lzGasLimit

    const nativeFeeFormatted = formatUnits(estimatedFeeWei, 18)
    
    // Encode message payload using Viem ABI parameters
    const encodedPayload = encodeAbiParameters(
      parseAbiParameters("string, uint256"),
      [messagePayload, BigInt(Date.now())]
    )

    return {
      sourceChainId,
      destinationChainId,
      estimatedNativeFee: Number(nativeFeeFormatted).toFixed(6),
      estimatedUsdcValue: (Number(nativeFeeFormatted) * 3200).toFixed(2), // ETH -> USDC estimation rate for UI validation
      executionGasLimit: lzGasLimit.toString(),
      payloadBytes: encodedPayload,
      isRouteAvailable: true,
    }
  } catch (error) {
    console.error("Error calculating LayerZero message quote:", error)
    return {
      sourceChainId,
      destinationChainId,
      estimatedNativeFee: "0.000000",
      estimatedUsdcValue: "0.00",
      executionGasLimit: "0",
      payloadBytes: "0x",
      isRouteAvailable: false,
    }
  }
}