"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Send, CheckCircle2, Loader2, AlertTriangle, ArrowRight, Wallet } from "lucide-react"
import { parseEther } from "viem"
import { useAccount, useChainId, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { arcTestnet } from "@/config/wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { validateTransfer, isSelfSend, shortAddr } from "@/lib/transfer"
import {
  loadContacts, saveContacts, sortContacts, contactFor, createContact,
  type Contact,
} from "@/lib/contacts"

// Transfer — the first real financial action in the AETHER shell. USDC is the
// NATIVE currency on Arc (18 decimals, see config/wagmi.ts), so a transfer is a
// native-value send via parseEther — the same self-custody path Oracle uses.
// AETHER never signs: the user reviews the real recipient + amount and signs in
// their own wallet (File 09). Lifecycle is shown live (File 02/05):
// Review → Signing → Broadcasting → Confirming → Success.

const EXPLORER = "https://testnet.arcscan.app"

type Step = "form" | "review" | "signing" | "broadcasting" | "confirming" | "success" | "error"

export function TransferForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [to, setTo] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [step, setStep] = React.useState<Step>("form")
  const [note, setNote] = React.useState("")
  const [contacts, setContacts] = React.useState<Contact[]>([])

  // Load saved contacts for the connected wallet (recipient picker).
  React.useEffect(() => {
    if (address) setContacts(loadContacts(address))
    else setContacts([])
  }, [address])

  // Prefill from a deep link (e.g. the AI assistant's confirm-action card):
  // /transfer?to=0x…&amount=5. Read once on mount; the user still reviews & signs.
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const qTo = p.get("to")
    const qAmt = p.get("amount")
    if (qTo && /^0x[a-fA-F0-9]{40}$/.test(qTo)) setTo(qTo)
    if (qAmt && /^[0-9]+(\.[0-9]+)?$/.test(qAmt)) setAmount(qAmt)
  }, [])

  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = React.useState<`0x${string}` | undefined>()
  const { isSuccess: mined, isError: mineError } = useWaitForTransactionReceipt({ hash })

  // Validation — real address + positive numeric amount (lib/transfer.ts).
  const { toValid, amtValid } = validateTransfer(to, amount)
  const selfSend = isSelfSend(to, address)

  // Advance the lifecycle as the receipt resolves.
  React.useEffect(() => {
    if (step !== "confirming") return
    if (mined) setStep("success")
    else if (mineError) {
      setNote("The transaction was submitted but did not confirm. Check the receipt on ArcScan.")
      setStep("error")
    }
  }, [mined, mineError, step])

  async function submit() {
    if (!toValid || !amtValid) return
    setNote("")
    setStep("signing")
    try {
      const tx = await sendTransactionAsync({ to: to.trim() as `0x${string}`, value: parseEther(amount) })
      setHash(tx)
      setStep("broadcasting")
      // Brief broadcasting beat, then wait for confirmation.
      setStep("confirming")
    } catch {
      setNote("You dismissed the wallet. Nothing was sent.")
      setStep("error")
    }
  }

  function reset() {
    setStep("form")
    setNote("")
    setHash(undefined)
    setTo("")
    setAmount("")
  }

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to send USDC">
        <p className="text-muted">Your wallet is your login. You review and sign every transfer yourself.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="Switch to Arc Testnet">
        <p className="text-muted">Transfers happen on Arc. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-white">
          Switch to Arc
        </button>
      </Centered>
    )

  const busy = step === "signing" || step === "broadcasting" || step === "confirming"

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Send className="h-6 w-6 text-primary" aria-hidden="true" /> Send USDC
        </h2>
        <p className="mt-1 text-sm text-muted">Native USDC on Arc Testnet. You sign in your own wallet — AetherFI never holds or moves your funds.</p>
      </div>

      {step === "success" ? (
        <SuccessCard to={to} amount={amount} hash={hash} onReset={reset} reduced={reduced} />
      ) : (
        <div className="glass space-y-4 p-6">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Recipient address</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={busy}
              placeholder="0x…"
              aria-invalid={to.length > 0 && !toValid}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
            {to.length > 0 && !toValid && <span className="mt-1 block text-xs text-red-400">Enter a valid 0x address.</span>}

            {/* Contact picker + save — only when there are contacts or a valid new address */}
            {(contacts.length > 0 || toValid) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {sortContacts(contacts).slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTo(c.address)}
                    disabled={busy}
                    className={
                      "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                      (to.toLowerCase() === c.address
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-white/10 text-muted hover:border-white/25 hover:text-foreground")
                    }
                  >
                    {c.label}
                  </button>
                ))}
                {contacts.length > 5 && (
                  <Link href="/contacts" className="text-xs text-muted underline transition hover:text-foreground">+{contacts.length - 5} more</Link>
                )}
                {toValid && !contactFor(contacts, to) && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
                      const c = createContact({ label: shortAddr(to.trim()), address: to, note: "" }, id, new Date().toISOString())
                      const next = [c, ...contacts]
                      setContacts(next)
                      if (address) saveContacts(address, next)
                    }}
                    disabled={busy}
                    className="rounded-full border border-dashed border-white/15 px-2.5 py-1 text-xs text-muted transition hover:border-primary/40 hover:text-foreground"
                  >
                    Save this address
                  </button>
                )}
              </div>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted">Amount (USDC)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={amount.length > 0 && !amtValid}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-lg font-semibold outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
            {amount.length > 0 && !amtValid && <span className="mt-1 block text-xs text-red-400">Enter an amount greater than zero.</span>}
          </label>

          {selfSend && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              This sends USDC to your own connected wallet.
            </div>
          )}

          {/* Human-readable review line (File 11 transaction safety). */}
          {toValid && amtValid && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
              <div className="text-muted">You are about to send</div>
              <div className="mt-1 flex items-center gap-2 font-semibold">
                <span className="grad-text text-lg">{amount} USDC</span>
                <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
                {(() => {
                  const known = contactFor(contacts, to)
                  return known ? (
                    <span className="flex items-center gap-1.5">
                      <span>{known.label}</span>
                      <span className="font-mono text-xs text-muted">{shortAddr(to.trim())}</span>
                    </span>
                  ) : (
                    <span className="font-mono text-xs">{shortAddr(to.trim())}</span>
                  )
                })()}
              </div>
            </div>
          )}

          {busy && <Lifecycle step={step} hash={hash} />}

          {step === "error" && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              <span>{note}</span>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!toValid || !amtValid || busy}
            className="btn-glow w-full rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {step === "signing" ? "Confirm in wallet…" : busy ? "Sending…" : step === "error" ? "Try again" : "Review & send"}
          </button>
        </div>
      )}

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

const STAGES: { key: Step; label: string }[] = [
  { key: "signing", label: "Signing" },
  { key: "broadcasting", label: "Broadcasting" },
  { key: "confirming", label: "Confirming" },
]

function Lifecycle({ step, hash }: { step: Step; hash?: `0x${string}` }) {
  const activeIdx = STAGES.findIndex((s) => s.key === step)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        {STAGES.map((s, i) => {
          const done = i < activeIdx
          const active = i === activeIdx
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <span className={"flex h-6 w-6 items-center justify-center rounded-full text-xs " + (done ? "bg-primary/30 text-foreground" : active ? "bg-primary/20 text-foreground" : "bg-white/5 text-muted")}>
                {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : active ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : i + 1}
              </span>
              <span className={"text-xs " + (active || done ? "text-foreground" : "text-muted")}>{s.label}</span>
              {i < STAGES.length - 1 && <span className="mx-1 hidden h-px flex-1 bg-white/10 sm:block" />}
            </div>
          )
        })}
      </div>
      {hash && (
        <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-muted underline">
          Track on ArcScan
        </a>
      )}
    </div>
  )
}

function SuccessCard({ to, amount, hash, onReset, reduced }: { to: string; amount: string; hash?: `0x${string}`; onReset: () => void; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="mt-3 text-lg font-bold">Sent {amount} USDC</div>
      <div className="mt-1 font-mono text-xs text-muted">to {shortAddr(to.trim())}</div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {hash && (
          <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-5 py-2 text-sm transition hover:border-primary/40">
            View receipt
          </a>
        )}
        <button onClick={onReset} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white">
          Send another
        </button>
      </div>
    </motion.div>
  )
}

function Centered({ icon: Icon, title, children }: { icon?: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 pt-24 text-center">
      {Icon && <div className="floaty text-primary"><Icon className="h-12 w-12" aria-hidden="true" /></div>}
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}
