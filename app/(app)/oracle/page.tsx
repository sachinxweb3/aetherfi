import type { Metadata } from "next"
import { OracleView } from "@/components/oracle/OracleView"

export const metadata: Metadata = {
  title: "Oracle — AetherFI",
  description: "Live price feeds for the assets you hold on Arc, with source, confidence and age.",
}

// /(app)/oracle — price feeds inside the shell route group. Reads live behind
// lib/oracle's adapter; the UI never fabricates a price, source or confidence
// (File 16 honesty).
export default function OraclePage() {
  return <OracleView />
}
