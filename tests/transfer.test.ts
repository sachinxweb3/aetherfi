import { describe, it, expect } from "vitest"
import { isValidAmount, isValidRecipient, isSelfSend, shortAddr, validateTransfer } from "../lib/transfer"

// Transfer-input validation — the safety gate before any wallet signs (File 11).
const A = "0x1111111111111111111111111111111111111111"
const B = "0x2222222222222222222222222222222222222222"

describe("isValidAmount", () => {
  it("accepts positive finite amounts", () => {
    expect(isValidAmount("1")).toBe(true)
    expect(isValidAmount("0.01")).toBe(true)
    expect(isValidAmount("1234.5")).toBe(true)
  })
  it("rejects empty, zero, negative, and non-numeric", () => {
    expect(isValidAmount("")).toBe(false)
    expect(isValidAmount("0")).toBe(false)
    expect(isValidAmount("-1")).toBe(false)
    expect(isValidAmount("abc")).toBe(false)
    expect(isValidAmount("Infinity")).toBe(false)
  })
})

describe("isValidRecipient", () => {
  it("accepts a real 0x address (with surrounding whitespace)", () => {
    expect(isValidRecipient(A)).toBe(true)
    expect(isValidRecipient(`  ${A}  `)).toBe(true)
  })
  it("rejects malformed input", () => {
    expect(isValidRecipient("")).toBe(false)
    expect(isValidRecipient("0x123")).toBe(false)
    expect(isValidRecipient("not-an-address")).toBe(false)
  })
})

describe("isSelfSend", () => {
  it("is true only when recipient equals the connected wallet (case-insensitive)", () => {
    expect(isSelfSend(A, A)).toBe(true)
    expect(isSelfSend(A.toUpperCase().replace("0X", "0x"), A)).toBe(true)
    expect(isSelfSend(A, B)).toBe(false)
    expect(isSelfSend(A, undefined)).toBe(false)
    expect(isSelfSend("0x123", A)).toBe(false)
  })
})

describe("shortAddr", () => {
  it("compacts a full address and leaves short strings intact", () => {
    expect(shortAddr(A)).toBe("0x11111111…11111111")
    expect(shortAddr("0x123")).toBe("0x123")
  })
})

describe("validateTransfer", () => {
  it("is ready only when both fields are valid", () => {
    expect(validateTransfer(A, "5")).toEqual({ toValid: true, amtValid: true, ready: true })
    expect(validateTransfer(A, "0")).toEqual({ toValid: true, amtValid: false, ready: false })
    expect(validateTransfer("0x123", "5")).toEqual({ toValid: false, amtValid: true, ready: false })
    expect(validateTransfer("", "").ready).toBe(false)
  })
})
