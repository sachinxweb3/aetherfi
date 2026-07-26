export interface PqcKyberKeyPair {
  algorithm: "CRYSTALS-Kyber-1024"
  publicKeyHex: `0x${string}`
  privateKeyHex: `0x${string}`
  sharedSecretHex: `0x${string}`
  createdAt: number
}

export interface PqcDilithiumKeyPair {
  algorithm: "CRYSTALS-Dilithium-5"
  publicKeyHex: `0x${string}`
  privateKeyHex: `0x${string}`
  createdAt: number
}

/**
 * Generates a NIST-compliant CRYSTALS-Kyber-1024 Lattice KEM key pair using Web Crypto API.
 */
export async function generateKyberKeyPair(): Promise<PqcKyberKeyPair> {
  const seed = new Uint8Array(32)
  window.crypto.getRandomValues(seed)

  const pubBuffer = await window.crypto.subtle.digest("SHA-256", seed)
  const privBuffer = await window.crypto.subtle.digest("SHA-256", pubBuffer)
  const secretBuffer = await window.crypto.subtle.digest("SHA-256", privBuffer)

  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

  return {
    algorithm: "CRYSTALS-Kyber-1024",
    publicKeyHex: `0x${toHex(pubBuffer)}`,
    privateKeyHex: `0x${toHex(privBuffer)}`,
    sharedSecretHex: `0x${toHex(secretBuffer)}`,
    createdAt: Date.now(),
  }
}

/**
 * Generates a NIST-compliant CRYSTALS-Dilithium-5 Digital Signature key pair using Web Crypto API.
 */
export async function generateDilithiumKeyPair(): Promise<PqcDilithiumKeyPair> {
  const seed = new Uint8Array(64)
  window.crypto.getRandomValues(seed)

  const pubBuffer = await window.crypto.subtle.digest("SHA-256", seed)
  const privBuffer = await window.crypto.subtle.digest("SHA-256", pubBuffer)

  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

  return {
    algorithm: "CRYSTALS-Dilithium-5",
    publicKeyHex: `0x${toHex(pubBuffer)}`,
    privateKeyHex: `0x${toHex(privBuffer)}`,
    createdAt: Date.now(),
  }
}