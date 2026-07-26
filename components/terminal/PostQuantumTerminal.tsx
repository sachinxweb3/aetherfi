"use client"

import * as React from "react"
import {
  generateKyberKeyPair,
  generateDilithiumKeyPair,
  type PqcKyberKeyPair,
  type PqcDilithiumKeyPair,
} from "@/lib/security/postQuantum"
import {
  signPayloadPostQuantum,
  verifyQuantumSignature,
  type QuantumSignatureResult,
} from "@/lib/security/pqcVault"
import { ShieldAlert, KeyRound, FileCheck, Lock, CheckCircle2, RefreshCw } from "lucide-react"

export function PostQuantumTerminal() {
  const [kyberKey, setKyberKey] = React.useState<PqcKyberKeyPair | null>(null)
  const [dilithiumKey, setDilithiumKey] = React.useState<PqcDilithiumKeyPair | null>(null)
  const [payloadText, setPayloadText] = React.useState<string>("AETHERFI_QUANTUM_TRANSACTION_PAYLOAD")
  const [signatureResult, setSignatureResult] = React.useState<QuantumSignatureResult | null>(null)
  const [isVerified, setIsVerified] = React.useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false)

  const handleGenerateKeys = React.useCallback(async () => {
    setIsGenerating(true)
    try {
      const kyber = await generateKyberKeyPair()
      const dilithium = await generateDilithiumKeyPair()
      setKyberKey(kyber)
      setDilithiumKey(dilithium)
      setSignatureResult(null)
      setIsVerified(null)
    } catch (err) {
      console.error("Key generation error:", err)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  React.useEffect(() => {
    handleGenerateKeys()
  }, [handleGenerateKeys])

  const handleSignPayload = async () => {
    if (!dilithiumKey || !payloadText) return
    const sig = await signPayloadPostQuantum(payloadText, dilithiumKey)
    setSignatureResult(sig)
    const valid = await verifyQuantumSignature(sig, dilithiumKey.publicKeyHex)
    setIsVerified(valid)
  }

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Post-Quantum Cryptographic Shield</h3>
            <p className="text-xs text-muted-foreground">NIST Kyber-1024 KEM & Dilithium-5 Lattice Key Engine</p>
          </div>
        </div>

        <button
          onClick={handleGenerateKeys}
          disabled={isGenerating}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          Regenerate Lattice Keys
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Lattice-Based Key Pairs
          </span>

          {kyberKey && (
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{kyberKey.algorithm}</span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                  Key Encapsulation
                </span>
              </div>
              <div className="font-mono text-xs text-muted-foreground truncate">
                Public Key: {kyberKey.publicKeyHex}
              </div>
              <div className="font-mono text-xs text-emerald-400 truncate">
                Shared Secret: {kyberKey.sharedSecretHex}
              </div>
            </div>
          )}

          {dilithiumKey && (
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{dilithiumKey.algorithm}</span>
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/30">
                  Digital Signature
                </span>
              </div>
              <div className="font-mono text-xs text-muted-foreground truncate">
                Public Key: {dilithiumKey.publicKeyHex}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Quantum Payload Signer & Verifier
          </span>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Execution Payload Text
              </label>
              <input
                type="text"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleSignPayload}
              disabled={!dilithiumKey || !payloadText}
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-cyan-500 transition-all disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Sign Payload with Dilithium-5
            </button>

            {signatureResult && (
              <div className="space-y-2 pt-1">
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-2.5 font-mono text-[11px] text-cyan-300 break-all">
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">
                    Lattice Signature Buffer:
                  </span>
                  {signatureResult.signatureHex}
                </div>

                {isVerified && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400 font-mono">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Post-Quantum Lattice Signature Verified Valid</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
        <span className="inline-flex items-center gap-1">
          <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
          Quantum Security Level: 256-bit Lattice Security (Post-Grover / Post-Shor)
        </span>
        <span className="font-mono text-[11px]">NIST PQC Standard Active</span>
      </div>
    </div>
  )
}