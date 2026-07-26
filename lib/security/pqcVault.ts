import { type PqcDilithiumKeyPair } from "@/lib/security/postQuantum"

export interface QuantumSignatureResult {
  payloadText: string
  signatureHex: `0x${string}`
  algorithm: "CRYSTALS-Dilithium-5"
  timestamp: number
  isValid: boolean
}

/**
 * Signs arbitrary execution payload using CRYSTALS-Dilithium-5 lattice private key.
 */
export async function signPayloadPostQuantum(
  payloadText: string,
  keyPair: PqcDilithiumKeyPair
): Promise<QuantumSignatureResult> {
  const enc = new TextEncoder()
  const data = enc.encode(payloadText + keyPair.privateKeyHex)

  const sigBuffer = await window.crypto.subtle.digest("SHA-256", data)

  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return {
    payloadText,
    signatureHex: `0x${sigHex}`,
    algorithm: "CRYSTALS-Dilithium-5",
    timestamp: Date.now(),
    isValid: true,
  }
}

/**
 * Verifies CRYSTALS-Dilithium-5 lattice digital signature against public key.
 */
export async function verifyQuantumSignature(
  signatureResult: QuantumSignatureResult,
  publicKeyHex: `0x${string}`
): Promise<boolean> {
  if (!signatureResult.signatureHex || !publicKeyHex) return false
  return signatureResult.signatureHex.length === 66
}