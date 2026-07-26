"use client"

import * as React from "react"
import { useAetherWallet } from "@/hooks/useAetherWallet"
import { generateStealthKeyPair, deriveStealthAddress, type StealthKeyPair, type DerivedStealthAddress } from "@/lib/privacy/stealthAddress"
import { encryptActivityLog, decryptActivityLog, type EncryptedLogEntry, type LogPayload } from "@/lib/privacy/encryptedLogger"
import { Shield, Lock, Eye, Key, Check, Copy, RefreshCw } from "lucide-react"

export function StealthPrivacyTerminal() {
  const { chainId, isConnected } = useAetherWallet()

  const [stealthKeys, setStealthKeys] = React.useState<StealthKeyPair | null>(null)
  const [targetAddress, setTargetAddress] = React.useState<DerivedStealthAddress | null>(null)
  const [logActionText, setLogActionText] = React.useState<string>("Arc USDC Yield Allocation")
  const [passphrase, setPassphrase] = React.useState<string>("aetherfi-zk-key-2026")
  const [encryptedLog, setEncryptedLog] = React.useState<EncryptedLogEntry | null>(null)
  const [decryptedLog, setDecryptedLog] = React.useState<LogPayload | null>(null)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const handleGenerateKeys = React.useCallback(() => {
    const keys = generateStealthKeyPair()
    setStealthKeys(keys)
    const derived = deriveStealthAddress(keys.stealthMetaAddress)
    setTargetAddress(derived)
  }, [])

  React.useEffect(() => {
    handleGenerateKeys()
  }, [handleGenerateKeys])

  const handleEncryptLog = async () => {
    if (!logActionText) return
    const payload: LogPayload = {
      timestamp: Date.now(),
      action: logActionText,
      details: "Zero-Knowledge Stealth Swap Executed",
      chainId,
    }
    const encrypted = await encryptActivityLog(payload, passphrase)
    setEncryptedLog(encrypted)
    setDecryptedLog(null)
  }

  const handleDecryptLog = async () => {
    if (!encryptedLog) return
    try {
      const decrypted = await decryptActivityLog(encryptedLog, passphrase)
      setDecryptedLog(decrypted)
    } catch (err) {
      console.error("Decryption failed:", err)
      alert("Invalid decryption passphrase.")
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">ZK Stealth & Encrypted Log Engine</h3>
            <p className="text-xs text-muted-foreground">EIP-5564 Stealth Addresses & Client-Side AES-256-GCM Logs</p>
          </div>
        </div>

        <button
          onClick={handleGenerateKeys}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate Keys
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Stealth Address Keys (EIP-5564)
          </span>

          {stealthKeys && (
            <div className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-4">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Stealth Meta-Address</span>
                <div className="mt-1 flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 font-mono text-xs text-emerald-400 truncate">
                  <span className="truncate">{stealthKeys.stealthMetaAddress}</span>
                  <button
                    onClick={() => copyToClipboard(stealthKeys.stealthMetaAddress, "meta")}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    {copiedField === "meta" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {targetAddress && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Derived One-Time Stealth Target</span>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 font-mono text-xs text-foreground truncate">
                    <span className="truncate">{targetAddress.stealthAddress}</span>
                    <button
                      onClick={() => copyToClipboard(targetAddress.stealthAddress, "target")}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      {copiedField === "target" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Zero-Knowledge Activity Log Vault
          </span>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Activity Log Content</label>
              <input
                type="text"
                value={logActionText}
                onChange={(e) => setLogActionText(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Encryption Passphrase</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEncryptLog}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                Encrypt Log
              </button>

              <button
                onClick={handleDecryptLog}
                disabled={!encryptedLog}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50 transition-all"
              >
                <Eye className="h-3.5 w-3.5" />
                Decrypt Log
              </button>
            </div>

            {encryptedLog && (
              <div className="mt-2 space-y-2">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 font-mono text-[11px] text-emerald-400 break-all">
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">AES-256-GCM Ciphertext:</span>
                  {encryptedLog.ciphertext.slice(0, 48)}...
                </div>

                {decryptedLog && (
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-2.5 font-mono text-[11px] text-cyan-300">
                    <span className="text-muted-foreground block text-[10px] uppercase font-sans">Decrypted Log Payload:</span>
                    {JSON.stringify(decryptedLog)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}