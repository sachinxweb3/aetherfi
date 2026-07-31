import { http } from "wagmi"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { type Chain } from "viem"

export const arcTestnet: Chain = {
  id: 5042002,
  name: "Arc Chain Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
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

// Free WalletConnect Project ID enables mobile wallets (MetaMask mobile, Rabby,
// Trust, etc.). Get one at https://cloud.walletconnect.com. Desktop injected
// wallets work regardless.
const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo"

export const config = getDefaultConfig({
  appName: "AetherFi — Arc Wallet Kundli",
  projectId: wcProjectId,
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
})
