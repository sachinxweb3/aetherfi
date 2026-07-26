import { type PublicClient, formatUnits } from "viem"
import { arcTestnet } from "@/config/wagmi"

export interface ArcGasQuote {
  gasPriceGwei: string
  usdcGasFeeFormatted: string
  rawGasPriceWei: bigint
  isNativeUsdcGas: boolean
}

export interface LayerZeroBridgeQuote {
  destinationChainId: number
  estimatedNativeFee: string
  estimatedUsdcFee: string
  relayReady: boolean
}

export const ARC_GAS_ENGINE_ADDRESS =
  (process.env.NEXT_PUBLIC_ARC_GAS_ENGINE_ADDRESS as `0x${string}`) ||
  "0x5040000000000000000000000000000000000001"

export async function getArcGasPriceQuote(
  publicClient: PublicClient
): Promise<ArcGasQuote> {
  try {
    const gasPrice = await publicClient.getGasPrice()
    const gasPriceGwei = formatUnits(gasPrice, 9)

    // Standard transfer cost calculation (21,000 gas units)
    const standardGasLimit = BigInt(21000)
    const totalFeeWei = gasPrice * standardGasLimit

    // Arc Chain native currency decimals (18)
    const usdcGasFeeFormatted = formatUnits(
      totalFeeWei,
      arcTestnet.nativeCurrency.decimals
    )

    return {
      gasPriceGwei: Number(gasPriceGwei).toFixed(4),
      usdcGasFeeFormatted: Number(usdcGasFeeFormatted).toFixed(6),
      rawGasPriceWei: gasPrice,
      isNativeUsdcGas: publicClient.chain?.id === arcTestnet.id,
    }
  } catch (error) {
    console.error("Error querying Arc Gas Price from RPC:", error)
    throw new Error("Failed to fetch live gas parameters from connected RPC.")
  }
}

export async function estimateLayerZeroRelayFee(
  publicClient: PublicClient,
  destinationChainId: number
): Promise<LayerZeroBridgeQuote> {
  try {
    const gasPrice = await publicClient.getGasPrice()
    // Standard LayerZero cross-chain payload gas overhead estimate (150,000 gas units)
    const crossChainGasLimit = BigInt(150000)
    const totalBridgeFeeWei = gasPrice * crossChainGasLimit

    const feeFormatted = formatUnits(totalBridgeFeeWei, 18)

    return {
      destinationChainId,
      estimatedNativeFee: Number(feeFormatted).toFixed(6),
      estimatedUsdcFee: Number(feeFormatted).toFixed(4),
      relayReady: true,
    }
  } catch (error) {
    console.error("Error estimating LayerZero relay fee:", error)
    return {
      destinationChainId,
      estimatedNativeFee: "0.000000",
      estimatedUsdcFee: "0.0000",
      relayReady: false,
    }
  }
}