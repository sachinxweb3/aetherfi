import { ImageResponse } from "next/og"
import { computeScore, rankFor } from "@/lib/arc"
import { seedFromAddress } from "@/lib/aura"

// Build a deterministic multi-blob gradient from the wallet seed so every
// share card looks unique — the flat OG mirror of the live WebGL aura. Tuned
// to the champagne/ice identity, so cards sit in the same family as the app.
function auraBackground(seed: [number, number, number, number]): string {
  const [a, b, c, d] = seed
  const hueA = Math.round(40 + a * 30) // champagne→gold range
  const hueB = Math.round(190 + b * 25) // ice→sky range
  const x1 = Math.round(10 + c * 40)
  const y1 = Math.round(5 + d * 35)
  const x2 = Math.round(60 + a * 35)
  const y2 = Math.round(60 + b * 35)
  const x3 = Math.round(30 + d * 50)
  return [
    `radial-gradient(circle at ${x1}% ${y1}%, hsla(${hueA},45%,68%,0.5), transparent 42%)`,
    `radial-gradient(circle at ${x2}% ${y2}%, hsla(${hueB},35%,62%,0.42), transparent 45%)`,
    `radial-gradient(circle at ${x3}% 30%, hsla(${(hueA + 30) % 360},40%,62%,0.3), transparent 40%)`,
  ].join(", ")
}

// Node.js (Fluid Compute) runtime — edge is discouraged in this stack and the
// ImageResponse docs use the default runtime. Satori requires an explicit
// `display` on every <div> that has more than one child.
export const runtime = "nodejs"

const ADDR = /^0x[a-fA-F0-9]{40}$/
const API = "https://testnet.arcscan.app/api/v2"

interface Stats {
  score: number
  rank: string
  txCount: number
  balance: string
  short: string
}

// Pull the on-chain stats for one wallet, with safe defaults on any failure.
async function loadStats(address: string): Promise<Stats> {
  const out: Stats = { score: 0, rank: "Fresh Wallet", txCount: 0, balance: "0", short: "0x…" }
  if (!ADDR.test(address)) return out
  try {
    const addr = address.toLowerCase()
    const [info, counters] = await Promise.all([
      fetch(`${API}/addresses/${addr}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/addresses/${addr}/counters`, { cache: "no-store" }).then((r) => r.json()),
    ])
    const bal = Number(info?.coin_balance ?? 0) / 1e18
    out.txCount = Number(counters?.transactions_count ?? 0)
    const gas = Number(counters?.gas_usage_count ?? 0)
    const tok = Number(counters?.token_transfers_count ?? 0)
    out.score = computeScore({ balanceUSDC: bal, txCount: out.txCount, gasUsed: gas, tokenTransfers: tok, walletAgeDays: 0 })
    out.rank = rankFor(out.score).rank
    out.balance = bal >= 1000 ? `${(bal / 1000).toFixed(1)}k` : bal.toFixed(2)
    out.short = `${address.slice(0, 6)}…${address.slice(-4)}`
  } catch {
    /* fall through with defaults */
  }
  return out
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address") ?? ""
  const a = searchParams.get("a") ?? ""
  const b = searchParams.get("b") ?? ""

  // Compare mode: two valid wallets → render a head-to-head battle card.
  if (ADDR.test(a) && ADDR.test(b)) {
    return compareImage(a, b)
  }

  const s = await loadStats(address)
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
            background: "#0a0a0b",
            backgroundImage: bg,
            color: "#f2efe6",
            padding: 64,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
            <span style={{ color: "#d8c08a", marginRight: 12 }}>◆</span>
            <span style={{ color: "#f2efe6" }}>Aether</span>
            <span style={{ color: "#d8c08a" }}>FI</span>
            <span style={{ color: "#9a978d", marginLeft: 12 }}>Aura</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <div style={{ display: "flex", fontSize: 28, color: "#9a978d" }}>{s.short}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
              <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1 }}>{s.score}</div>
              <div style={{ display: "flex", fontSize: 40, color: "#9a978d" }}>/ 1000</div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 700,
                background: "linear-gradient(90deg,#b8975a,#9fc1d6)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {s.rank}
            </div>
          </div>

          <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
            <Stat label="Transactions" value={String(s.txCount)} />
            <Stat label="USDC Balance" value={s.balance} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", fontSize: 22, color: "#9a978d" }}>Built on Arc Testnet</div>
              <div style={{ display: "flex", fontSize: 22, color: "#d8c08a" }}>aetherfi.vercel.app</div>
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

// Head-to-head battle card for /compare/[a]/[b] share links.
async function compareImage(a: string, b: string) {
  const [sa, sb] = await Promise.all([loadStats(a), loadStats(b)])
  const aWins = sa.score >= sb.score
  const bgA = auraBackground(seedFromAddress(a))
  const bgB = auraBackground(seedFromAddress(b))

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#0a0a0b",
            color: "#f2efe6",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
              paddingTop: 36,
            }}
          >
            <span style={{ color: "#d8c08a", marginRight: 12 }}>◆</span>
            <span style={{ color: "#f2efe6" }}>Aether</span>
            <span style={{ color: "#d8c08a" }}>FI</span>
            <span style={{ color: "#9a978d", marginLeft: 12 }}>· Aura Battle</span>
          </div>

          <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
            <Side stats={sa} bg={bgA} win={aWins} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                fontSize: 56,
                fontWeight: 900,
                color: "#9a978d",
              }}
            >
              VS
            </div>
            <Side stats={sb} bg={bgB} win={!aWins} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "#d8c08a",
              paddingBottom: 30,
            }}
          >
            aetherfi.vercel.app
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch (e) {
    return new Response(`Failed to generate image: ${(e as Error).message}`, { status: 500 })
  }
}

// One combatant column in the battle card.
function Side({ stats, bg, win }: { stats: Stats; bg: string; win: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 6,
        backgroundImage: bg,
        border: win ? "2px solid #d8c08a" : "2px solid transparent",
      }}
    >
      {win && (
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#d8c08a" }}>
          ♛ Winner
        </div>
      )}
      <div style={{ display: "flex", fontSize: 26, color: "#9a978d" }}>{stats.short}</div>
      <div style={{ display: "flex", fontSize: 100, fontWeight: 800, lineHeight: 1 }}>{stats.score}</div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#f2efe6" }}>{stats.rank}</div>
      <div style={{ display: "flex", fontSize: 22, color: "#9a978d" }}>{stats.txCount} tx</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 22, color: "#9a978d" }}>{label}</div>
    </div>
  )
}
