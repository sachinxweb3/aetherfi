"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Medal } from "lucide-react"
import type { Entry } from "@/lib/leaderboard"

export function Leaderboard() {
  const [entries, setEntries] = React.useState<Entry[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let alive = true
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setEntries(d.entries ?? [])
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const medalColor = (i: number) =>
    i === 0 ? "text-champagne" : i === 1 ? "text-silver" : "text-champagne-deep"
  const medal = (i: number) =>
    i < 3 ? (
      <Medal className={`mx-auto h-4 w-4 ${medalColor(i)}`} aria-label={`Rank ${i + 1}`} />
    ) : (
      `#${i + 1}`
    )

  return (
    <div className="card-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-champagne" aria-hidden="true" /> Arc Leaderboard
        </div>
        <div className="text-xs text-silver-dim">Top wallets by Aura score</div>
      </div>

      {loading ? (
        <div role="status" className="py-8 text-center text-sm text-silver-dim">Loading rankings…</div>
      ) : entries.length === 0 ? (
        <div role="status" className="py-8 text-center text-sm text-silver-dim">
          No entries yet. Connect your wallet to be the first on the board.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <motion.div
              key={e.address}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-xl bg-champagne/[0.03] px-3 py-2"
            >
              <div className="w-8 text-center text-sm font-bold">{medal(i)}</div>
              <Link
                href={`/w/${e.address}`}
                className="flex-1 font-mono text-sm hover:text-champagne"
              >
                {e.address.slice(0, 6)}…{e.address.slice(-4)}
              </Link>
              <div className="text-xs text-silver-dim">{e.rank}</div>
              <div className="w-16 text-right font-bold">{e.score}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
