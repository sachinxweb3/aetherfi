"use client"

import { useAccount, useChainId, useSwitchChain, useBalance, usePublicClient } from "wagmi"
import { formatEther, formatUnits, type Address } from "viem"
import { arcTestnet } from "@/config/wagmi"

export interface WalletState {
  address: Address | undefined
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  chainId: number
  chainName: string | undefined
  isWrongNetwork: boolean
  formattedBalance: string
  symbol: string
  switchNetwork: (targetChainId?: number) => Promise<void>
  estimateGasPrice: () => Promise<string | null>
}

export function useAetherWallet(): WalletState {
  const { address, isConnected, isConnecting, isReconnecting, chain } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient()

  const { data: balanceData } = useBalance({
    address,
    chainId: chainId || arcTestnet.id,
    query: {
      enabled: Boolean(address),
      refetchInterval: 4000,
    },
  })

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id && chain?.id !== chainId

  const switchNetwork = async (targetChainId: number = arcTestnet.id) => {
    if (!switchChainAsync) return
    try {
      await switchChainAsync({ chainId: targetChainId })
    } catch (error) {
      console.error("Failed to switch network:", error)
      throw error
    }
  }

  const estimateGasPrice = async (): Promise<string | null> => {
    if (!publicClient) return null
    try {
      const gasPrice = await publicClient.getGasPrice()
      return formatEther(gasPrice)
    } catch (error) {
      console.error("Failed to fetch gas price:", error)
      return null
    }
  }

  let formattedBalance = "0.0000"

  if (balanceData?.value !== undefined) {
    const rawValue = balanceData.value

    if (rawValue > 0n) {
      const val18Str = formatUnits(rawValue, 18)
      const num18 = parseFloat(val18Str)

      // Auto-detect 6-decimal USDC base units vs 18-decimal EVM wei
      if (num18 < 0.0001 && rawValue >= 1000n) {
        const val6Str = formatUnits(rawValue, 6)
        const num6 = parseFloat(val6Str)
        formattedBalance = !isNaN(num6) ? num6.toFixed(4) : "0.0000"
      } else {
        formattedBalance = !isNaN(num18) ? num18.toFixed(4) : "0.0000"
      }
    } else {
      formattedBalance = "0.0000"
    }
  }

  return {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    chainId,
    chainName: chain?.name,
    isWrongNetwork,
    formattedBalance,
    symbol: balanceData?.symbol || "USDC",
    switchNetwork,
    estimateGasPrice,
  }
}