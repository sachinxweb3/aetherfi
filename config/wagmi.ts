import { http, createConfig } from "wagmi"
import { mainnet, sepolia, arbitrum } from "wagmi/chains"
import { type Chain } from "viem"

export const arcTestnet: Chain = {
  id: 5042002,
  name: "Arc Chain Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6, // Arc Chain native USDC gas uses 6 decimals (not 18)
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [arcTestnet, mainnet, arbitrum, sepolia],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
  },
})