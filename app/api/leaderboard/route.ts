import { NextResponse } from "next/server"
import { submit, top, type Entry } from "@/lib/leaderboard"

export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/

export async function GET() {
  const entries = await top(25)
  return NextResponse.json({ entries })
}

export async function POST(req: Request) {
  let body: Partial<Entry> = {}
  try {
    body = (await req.json()) as Partial<Entry>
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.address || !ADDR.test(body.address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
  }
  await submit({
    address: body.address.toLowerCase(),
    score: Math.max(0, Math.min(1000, Number(body.score) || 0)),
    rank: String(body.rank ?? "Fresh Wallet").slice(0, 40),
    txCount: Math.max(0, Number(body.txCount) || 0),
    updatedAt: Date.now(),
  })
  return NextResponse.json({ ok: true })
}
