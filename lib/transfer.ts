import { isAddress } from "viem"

// Pure, testable transfer-input validation — shared by TransferForm and unit
// tests (File 11 transaction safety, File 12 coverage). Keeps the signing
// component thin: the component owns wallet state, this owns "is this input
// safe to hand to a wallet".

export type TransferValidation = {
  toValid: boolean
  amtValid: boolean
  ready: boolean
}

// A positive, finite decimal amount. Rejects "", "0", negatives, NaN, Infinity.
export function isValidAmount(amount: string): boolean {
  const n = Number(amount)
  return Number.isFinite(n) && n > 0
}

// A real 0x address (delegates to viem's checksum-aware validator).
export function isValidRecipient(to: string): boolean {
  return isAddress(to.trim())
}

// True when recipient resolves to the sender's own connected wallet.
export function isSelfSend(to: string, self?: string): boolean {
  if (!self || !isValidRecipient(to)) return false
  return to.trim().toLowerCase() === self.toLowerCase()
}

// Compact 0x…tail rendering for review + receipt lines.
export function shortAddr(to: string): string {
  if (to.length <= 18) return to
  return `${to.slice(0, 10)}…${to.slice(-8)}`
}

export function validateTransfer(to: string, amount: string): TransferValidation {
  const toValid = isValidRecipient(to)
  const amtValid = isValidAmount(amount)
  return { toValid, amtValid, ready: toValid && amtValid }
}
