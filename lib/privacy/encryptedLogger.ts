export interface LogPayload {
  timestamp: number
  action: string
  details: string
  chainId: number
}

export interface EncryptedLogEntry {
  id: string
  ciphertext: string
  iv: string
  timestamp: number
}

/**
 * Encrypts arbitrary activity payload using client-side AES-256-GCM via Web Crypto API.
 */
export async function encryptActivityLog(
  payload: LogPayload,
  secretPassphrase: string
): Promise<EncryptedLogEntry> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secretPassphrase.padStart(32, "0")),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  const salt = enc.encode("AETHERFI_ZK_SALT")
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const data = enc.encode(JSON.stringify(payload))

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  )

  const ciphertextArray = Array.from(new Uint8Array(ciphertextBuffer))
  const ciphertextBase64 = btoa(String.fromCharCode(...ciphertextArray))
  const ivBase64 = btoa(String.fromCharCode(...iv))

  return {
    id: `zk-log-${Date.now()}`,
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    timestamp: payload.timestamp,
  }
}

/**
 * Decrypts AES-256-GCM encrypted log payload using client-side passphrase.
 */
export async function decryptActivityLog(
  encryptedEntry: EncryptedLogEntry,
  secretPassphrase: string
): Promise<LogPayload> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secretPassphrase.padStart(32, "0")),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  const salt = enc.encode("AETHERFI_ZK_SALT")
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  )

  const ciphertextBytes = new Uint8Array(
    atob(encryptedEntry.ciphertext)
      .split("")
      .map((c) => c.charCodeAt(0))
  )

  const ivBytes = new Uint8Array(
    atob(encryptedEntry.iv)
      .split("")
      .map((c) => c.charCodeAt(0))
  )

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    ciphertextBytes
  )

  return JSON.parse(dec.decode(decryptedBuffer))
}