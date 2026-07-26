import { type PublicClient, formatUnits } from "viem"

export interface DePinVaultClaimQuote {
  nodeId: string
  unclaimedUsdc: string
  estimatedClaimGasFeeUsdc: string
  isClaimable: boolean
  vaultContractAddress: `0x${string}`
}

export const DEPIN_VAULT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_DEPIN_VAULT_ADDRESS as `0x${string}`) ||
  "0x5040000000000000000000000000000000000003"

/**
 * Queries live RPC gas rates to compute DePIN reward vault claim gas estimates.
 */
export async function getDePinVaultClaimQuote(
  publicClient: PublicClient,
  nodeId: string,
  unclaimedRewardsUsdc: string
): Promise<DePinVaultClaimQuote> {
  try {
    const gasPrice = await publicClient.getGasPrice()
    const claimGasLimit = BigInt(120000)
    const totalGasFeeWei = gasPrice * claimGasLimit

    const gasFeeFormatted = formatUnits(totalGasFeeWei, 18)

    return {
      nodeId,
      unclaimedUsdc: unclaimedRewardsUsdc,
      estimatedClaimGasFeeUsdc: Number(gasFeeFormatted).toFixed(6),
      isClaimable: parseFloat(unclaimedRewardsUsdc) > 0,
      vaultContractAddress: DEPIN_VAULT_ADDRESS,
    }
  } catch (error) {
    console.error("Error computing DePIN vault claim quote:", error)
    return {
      nodeId,
      unclaimedUsdc: unclaimedRewardsUsdc,
      estimatedClaimGasFeeUsdc: "0.000000",
      isClaimable: false,
      vaultContractAddress: DEPIN_VAULT_ADDRESS,
    }
  }
}