"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Settings as SettingsIcon, Sparkles, Zap, MonitorSmartphone, Wallet,
  ShieldCheck, Database, Trash2, ExternalLink, Check, LogOut, Volume2, VolumeX,
} from "lucide-react"
import { useAccount, useDisconnect, useChainId } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import { ARCSCAN_URL } from "@/lib/arc"
import {
  MOTION_KEY, SOUND_KEY, PREFS_EVENT, isMotionPref, isSoundOn, soundValue,
  summarizeData, aetherKeys, type MotionPref, type DataSummaryRow,
} from "@/lib/prefs"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Settings — the AETHER control surface (File 03 OS navigation). Every control
// is really wired: motion feeds useReducedMotion app-wide, and the Privacy panel
// enumerates only the localStorage keys AETHER actually owns, clearing nothing
// else (File 16 honesty). Read-only toward the chain; no funds ever move here.

const MOTION_OPTIONS: { value: MotionPref; label: string; detail: string }[] = [
  { value: "system", label: "System", detail: "Follow your device's reduce-motion setting" },
  { value: "reduce", label: "Reduced", detail: "Minimize animation everywhere" },
  { value: "full", label: "Full", detail: "Always show full motion" },
]

export function SettingsView() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [motionPref, setMotionPref] = React.useState<MotionPref>("system")
  const [soundOn, setSoundOn] = React.useState(false)
  const [dataRows, setDataRows] = React.useState<DataSummaryRow[]>([])
  const [cleared, setCleared] = React.useState(false)

  const refreshData = React.useCallback(() => {
    try {
      setDataRows(summarizeData(Object.keys(window.localStorage)))
    } catch {
      setDataRows([])
    }
  }, [])

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MOTION_KEY)
      if (isMotionPref(stored)) setMotionPref(stored)
      setSoundOn(isSoundOn(window.localStorage.getItem(SOUND_KEY)))
    } catch {}
    refreshData()
    // Reflect changes made elsewhere (e.g. the header ambient toggle) live.
    const sync = () => {
      try {
        setSoundOn(isSoundOn(window.localStorage.getItem(SOUND_KEY)))
      } catch {}
    }
    window.addEventListener(PREFS_EVENT, sync)
    return () => window.removeEventListener(PREFS_EVENT, sync)
  }, [refreshData])

  function chooseMotion(pref: MotionPref) {
    setMotionPref(pref)
    try {
      window.localStorage.setItem(MOTION_KEY, pref)
      window.dispatchEvent(new Event(PREFS_EVENT))
    } catch {}
  }

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    try {
      window.localStorage.setItem(SOUND_KEY, soundValue(next))
      window.dispatchEvent(new Event(PREFS_EVENT))
    } catch {}
  }

  function clearLocalData() {
    try {
      const mine = aetherKeys(Object.keys(window.localStorage))
      mine.forEach((k) => window.localStorage.removeItem(k))
      window.dispatchEvent(new Event(PREFS_EVENT))
    } catch {}
    setMotionPref("system")
    setSoundOn(false)
    setCleared(true)
    refreshData()
    setTimeout(() => setCleared(false), 2500)
  }

  const totalStored = dataRows.reduce((n, r) => n + r.count, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <SettingsIcon className="h-6 w-6 text-primary" aria-hidden="true" /> Settings
        </h2>
        <p className="mt-1 text-sm text-muted">
          Your AetherFI preferences and account. Everything here is stored locally in your browser — nothing is sent to a server.
        </p>
      </div>

      {/* Account */}
      <Section icon={Wallet} title="Account" reduced={reduced}>
        {isConnected && address ? (
          <div className="space-y-4">
            <Field label="Connected wallet">
              <span className="font-mono text-sm text-foreground">{address.slice(0, 10)}…{address.slice(-8)}</span>
            </Field>
            <Field label="Network">
              <span className={"inline-flex items-center gap-1.5 text-sm " + (onArc ? "text-emerald-400" : "text-amber-400")}>
                <span className={"h-1.5 w-1.5 rounded-full " + (onArc ? "bg-emerald-400" : "bg-amber-400")} />
                {onArc ? "Arc Testnet" : "Wrong network"}
              </span>
            </Field>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={`${ARCSCAN_URL}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                View on ArcScan <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <button
                onClick={() => disconnect()}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted">No wallet connected. Your wallet is your login — read-only and safe.</p>
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        )}
      </Section>

      {/* Appearance / Motion */}
      <Section icon={Sparkles} title="Appearance" reduced={reduced}>
        <Field label="Motion" hint={`Currently rendering with ${reduced ? "reduced" : "full"} motion.`}>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Motion preference">
            {MOTION_OPTIONS.map((opt) => {
              const active = motionPref === opt.value
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseMotion(opt.value)}
                  className={
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition " +
                    (active ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]")
                  }
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {opt.value === "full" ? <Zap className="h-3.5 w-3.5" aria-hidden="true" /> : <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden="true" />}
                    {opt.label}
                    {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                  </span>
                  <span className="text-xs text-muted">{opt.detail}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Ambient sound" hint={`Currently ${soundOn ? "playing" : "off"}.`}>
          <button
            role="switch"
            aria-checked={soundOn}
            onClick={toggleSound}
            className={
              "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition " +
              (soundOn ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]")
            }
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {soundOn ? <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" /> : <VolumeX className="h-4 w-4 text-muted" aria-hidden="true" />}
              {soundOn ? "Ambient audio on" : "Ambient audio off"}
            </span>
            <span
              className={
                "relative h-5 w-9 shrink-0 rounded-full transition " +
                (soundOn ? "bg-primary/70" : "bg-white/15")
              }
            >
              <span
                className={
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " +
                  (soundOn ? "left-[18px]" : "left-0.5")
                }
              />
            </span>
          </button>
          <p className="text-xs text-muted">
            A soft procedural drone generated in your browser — no audio files, nothing downloaded. Matches the ambient toggle in the header.
          </p>
        </Field>
      </Section>

      {/* Privacy & Data */}
      <Section icon={ShieldCheck} title="Privacy & data" reduced={reduced}>
        <p className="text-sm text-muted">
          AetherFI never uses cookies or trackers and never sends your data to a server. These are the only things it keeps in your
          browser&apos;s local storage:
        </p>
        <ul className="mt-4 space-y-2">
          {dataRows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{row.label}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] tabular-nums text-muted">
                    {row.count} {row.count === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={clearLocalData}
            disabled={totalStored === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear AetherFI local data
          </button>
          {cleared && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Cleared
            </span>
          )}
          {totalStored === 0 && !cleared && <span className="text-xs text-muted">Nothing stored yet.</span>}
        </div>
        <p className="mt-3 text-xs text-muted">
          Clearing removes only AetherFI&apos;s own keys — your wallet connection and unrelated site data are left untouched.
        </p>
      </Section>

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

function Section({
  icon: Icon, title, children, reduced,
}: {
  icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; reduced: boolean
}) {
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
      </div>
      {children}
    </motion.section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
