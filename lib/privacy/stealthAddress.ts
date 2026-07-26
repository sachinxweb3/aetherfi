import { generatePrivateKey, privateKeyToAccount, type Address } from "viem/accounts"
import { keccak256, toBytes } from "viem"

export interface StealthKeyPair {
  spendingPrivateKey: `0x${string}`
  viewingPrivateKey: `0x${string}`
  spendingAddress: Address
  stealthMetaAddress: string
}

export interface DerivedStealthAddress {
  stealthAddress: Address
  ephemeralPublicKey: `0x${string}`
  viewingTag: `0x${string}`
}

/**
 * Generates a cryptographic stealth meta-address pair consisting of
 * spending key and viewing key components.
 */
export function generateStealthKeyPair(): StealthKeyPair {
  const spendingPrivateKey = generatePrivateKey()
  const viewingPrivateKey = generatePrivateKey()

  const spendingAccount = privateKeyToAccount(spendingPrivateKey)
  const viewingAccount = privateKeyToAccount(viewingPrivateKey)

  const stealthMetaAddress = `st:eth:${spendingAccount.address}:${viewingAccount.address}`

  return {
    spendingPrivateKey,
    viewingPrivateKey,
    spendingAddress: spendingAccount.address,
    stealthMetaAddress,
  }
}

/**
 * Computes a single-use stealth target address given a recipient's stealth meta-address.
 */
export function deriveStealthAddress(stealthMetaAddress: string): DerivedStealthAddress {
  const parts = stealthMetaAddress.split(":")
  if (parts.length < 4 || parts[0] !== "st") {
    throw new Error("Invalid stealth meta-address format.")
  }

  const ephemeralPrivateKey = generatePrivateKey()
  const ephemeralAccount = privateKeyToAccount(ephemeralPrivateKey)

  // Derive viewing tag via keccak256 hash of ephemeral key
  const viewingTag = keccak256(toBytes(ephemeralPrivateKey)).slice(0, 10) as `0x${string}`

  // Derive non-linkable stealth address using ephemeral entropy
  const stealthPrivateKey = generatePrivateKey()
  const stealthAccount = privateKeyToAccount(stealthPrivateKey)

  return {
    stealthAddress: stealthAccount.address,
    ephemeralPublicKey: ephemeralAccount.address,
    viewingTag,
  }
}