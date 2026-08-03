import { NextResponse } from "next/server"
import { getTransactions } from "@/lib/arc"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

// Read-only transaction history for the Activity module. Same free ArcScan v2
// source as /api/kundli — no key, no writes.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address") ?? ""
  if (!ADDR.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
  }
  try {
    const items = await getTransactions(address)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "Failed to load activity" }, { status: 502 })
  }
}
