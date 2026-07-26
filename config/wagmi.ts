import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { defineChain } from "viem"
import { mainnet, arbitrum, sepolia } from "wagmi/chains"

export const arcTestnet = defineChain({
  id: 5040,
  name: "Arc Chain Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://explorer.testnet.arc.network",
    },
  },
  testnet: true,
})

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "aetherfi_default_project_id"

export const config = getDefaultConfig({
  appName: "AetherFI OS",
  projectId,
  chains: [mainnet, arbitrum, sepolia, arcTestnet],
  ssr: true,
})