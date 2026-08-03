"use client"

import * as React from "react"
import { motion } from "framer-motion"
import type { WalletKundli } from "@/lib/arc"

/**
 * Time Machine — scrub through the wallet's on-chain history day by day and
 * watch activity build. Reads purely from activityByDay, no network calls.
 */
export function TimeMachine({ data }: { data: WalletKundli }) {
  const days = data.activityByDay ?? []
  const [i, setI] = React.useState(Math.max(0, days.length - 1))

  if (days.length < 2) return null

  const max = Math.max(1, ...days.map((d) => d.count))
  const upto = days.slice(0, i + 1)
  const total = upto.reduce((n, d) => n + d.count, 0)
  const day = days[i]

  return (
    <div className="card-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-silver">Time Machine</div>
        <div className="text-xs text-silver-dim">
          <span className="font-mono text-foreground">{day?.date}</span> · {total} tx so far
        </div>
      </div>

      <div className="flex h-28 items-end gap-[2px]">
        {days.map((d, idx) => {
          const active = idx <= i
          return (
            <motion.div
              key={d.date}
              className="flex-1 rounded-t-sm"
              style={{
                background: active
                  ? "linear-gradient(180deg, #9fc1d6, #d8c08a)"
                  : "rgba(216,192,138,0.06)",
              }}
              animate={{ height: `${8 + (d.count / max) * 92}%` }}
              transition={{ duration: 0.3 }}
            />
          )
        })}
      </div>

      <input
        type="range"
        min={0}
        max={days.length - 1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
        className="mt-4 w-full accent-champagne"
        aria-label="Scrub wallet history"
      />
      <div className="mt-1 flex justify-between text-[10px] text-silver-dim">
        <span>{days[0]?.date}</span>
        <span>drag to travel through time</span>
        <span>{days[days.length - 1]?.date}</span>
      </div>
    </div>
  )
}
