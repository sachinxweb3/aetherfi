import { ImageResponse } from "next/og"
import { computeScore, rankFor } from "@/lib/arc"
import { seedFromAddress } from "@/lib/aura"

// Build a deterministic multi-blob gradient from the wallet seed so every
// share card looks unique — the flat OG mirror of the live WebGL aura.
function auraBackground(seed: [number, number, number, number]): string {
  const [a, b, c, d] = seed
  const hueA = Math.round(220 + a * 90) // violet→blue range
  const hueB = Math.round(160 + b * 80) // cyan→teal range
  const x1 = Math.round(10 + c * 40)
  const y1 = Math.round(5 + d * 35)
  const x2 = Math.round(60 + a * 35)
  const y2 = Math.round(60 + b * 35)
  const x3 = Math.round(30 + d * 50)
  return [
    `radial-gradient(circle at ${x1}% ${y1}%, hsla(${hueA},90%,65%,0.55), transparent 42%)`,
    `radial-gradient(circle at ${x2}% ${y2}%, hsla(${hueB},85%,60%,0.5), transparent 45%)`,
    `radial-gradient(circle at ${x3}% 30%, hsla(${(hueA + 40) % 360},80%,60%,0.35), transparent 40%)`,
  ].join(", ")
}

// Node.js (Fluid Compute) runtime — edge is discouraged in this stack and the
// ImageResponse docs use the default runtime. Satori requires an explicit
// `display` on every <div> that has more than one child.
export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/
const API = "https://testnet.arcscan.app/api/v2"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address") ?? ""

  let score = 0
  let rank = "Fresh Wallet"
  let txCount = 0
  let balance = "0"
  let short = "0x…"

  if (ADDR.test(address)) {
    try {
      const addr = address.toLowerCase()
      const [info, counters] = await Promise.all([
        fetch(`${API}/addresses/${addr}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/addresses/${addr}/counters`, { cache: "no-store" }).then((r) => r.json()),
      ])
      const bal = Number(info?.coin_balance ?? 0) / 1e18
      txCount = Number(counters?.transactions_count ?? 0)
      const gas = Number(counters?.gas_usage_count ?? 0)
      const tok = Number(counters?.token_transfers_count ?? 0)
      score = computeScore({ balanceUSDC: bal, txCount, gasUsed: gas, tokenTransfers: tok, walletAgeDays: 0 })
      rank = rankFor(score).rank
      balance = bal >= 1000 ? `${(bal / 1000).toFixed(1)}k` : bal.toFixed(2)
      short = `${address.slice(0, 6)}…${address.slice(-4)}`
    } catch {
      /* fall through with defaults */
    }
  }

  const bg = auraBackground(seedFromAddress(address))

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#05060f",
            backgroundImage: bg,
            color: "#e8ecff",
            padding: 64,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
            ◆ AetherFi Aura
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <div style={{ display: "flex", fontSize: 28, color: "#8b93b7" }}>{short}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
              <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1 }}>{score}</div>
              <div style={{ display: "flex", fontSize: 40, color: "#8b93b7" }}>/ 1000</div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 700,
                background: "linear-gradient(90deg,#7c5cff,#22d3ee)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {rank}
            </div>
          </div>

          <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
            <Stat label="Transactions" value={String(txCount)} />
            <Stat label="USDC Balance" value={balance} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", fontSize: 22, color: "#8b93b7" }}>Built on Arc Testnet</div>
              <div style={{ display: "flex", fontSize: 22, color: "#22d3ee" }}>aetherfi.vercel.app</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch (e) {
    return new Response(`Failed to generate image: ${(e as Error).message}`, { status: 500 })
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 22, color: "#8b93b7" }}>{label}</div>
    </div>
  )
}
