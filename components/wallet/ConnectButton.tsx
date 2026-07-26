"use client"

import * as React from "react"
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { ShieldCheck, Wallet, ChevronDown, AlertTriangle } from "lucide-react"

export function ConnectButton() {
  const { formattedBalance, symbol } = useAetherWallet()

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading"
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated")

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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Wrong Network
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all"
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
                    <span>{chain.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all font-mono"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {account.displayName} ({formattedBalance} {symbol})
                    </span>
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