// Free leaderboard store. Uses Upstash Redis REST (free tier) when
// KV_REST_API_URL + KV_REST_API_TOKEN are set; otherwise an in-memory fallback
// (resets on redeploy — fine for demo). No paid service required.

export interface Entry {
  address: string
  score: number
  rank: string
  txCount: number
  updatedAt: number
}

const KEY = "aetherfi:leaderboard"
const mem = new Map<string, Entry>()

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
const useRedis = Boolean(url && token)

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${url}/${cmd.map((c) => encodeURIComponent(String(c))).join("/")}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error("redis error")
  const data = (await res.json()) as { result: unknown }
  return data.result
}

export async function submit(e: Entry): Promise<void> {
  e.updatedAt = Date.now()
  if (useRedis) {
    // Sorted set by score + hash of details.
    await redis(["ZADD", KEY, e.score, e.address])
    await redis(["HSET", `${KEY}:d`, e.address, JSON.stringify(e)])
    return
  }
  mem.set(e.address, e)
}

export async function top(limit = 25): Promise<Entry[]> {
  if (useRedis) {
    try {
      const addrs = (await redis(["ZREVRANGE", KEY, 0, limit - 1])) as string[]
      if (!addrs?.length) return []
      const details = (await redis(["HMGET", `${KEY}:d`, ...addrs])) as (string | null)[]
      return details
        .filter(Boolean)
        .map((d) => JSON.parse(d as string) as Entry)
        .sort((a, b) => b.score - a.score)
    } catch {
      return []
    }
  }
  return [...mem.values()].sort((a, b) => b.score - a.score).slice(0, limit)
}
