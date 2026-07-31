import { NextResponse } from "next/server"
import { getKundli } from "@/lib/arc"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address") ?? ""
  if (!ADDR.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
  }
  try {
    const data = await getKundli(address)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to load on-chain data" }, { status: 502 })
  }
}
