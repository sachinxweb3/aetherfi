"use client"

import * as React from "react"
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { AlertTriangle, Wallet, ShieldCheck } from "lucide-react"

export function ConnectButton() {
  const { isWrongNetwork, switchNetwork } = useAetherWallet()

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported || isWrongNetwork) {
                return (
                  <button
                    onClick={() => switchNetwork()}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-md transition-all hover:bg-destructive/90"
                  >
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                    Wrong Network (Switch to Arc)
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md transition-all hover:bg-accent"
                  >
                    {chain.hasIcon && (
                      <div className="h-3.5 w-3.5 overflow-hidden rounded-full">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            className="h-3.5 w-3.5"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur-md transition-all hover:bg-primary/20"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ""}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}