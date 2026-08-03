"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CalendarClock, Plus, Send, Trash2, Pause, Play, X, AlertTriangle,
  Wallet, CheckCircle2, Repeat, ArrowRight,
} from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { arcTestnet } from "@/config/wagmi"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { shortAddr } from "@/lib/transfer"
import { loadContacts, contactFor, sortContacts, type Contact } from "@/lib/contacts"
import {
  CADENCES, validateRule, createRule, sortRules, ruleState, nextDueAt,
  describeRule, runHref, loadRules, saveRules,
  type AutomationRule, type RuleDraft, type Cadence, type RuleState,
} from "@/lib/automation"

// Automation — scheduled & recurring USDC payments (File 02 Core Module).
// A rule is an honest scheduled intent: AETHER surfaces what's due and hands the
// exact recipient + amount to the transfer flow to review and sign. Nothing is
// auto-sent and no keys are held (File 07/16). Rules persist per wallet in
// localStorage via lib/automation; all scheduling math lives there (tested).

const DAY = 86_400_000

// Default the start field to today (local date, yyyy-mm-dd) for the date input.
function todayLocal(): string {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

function relDue(ms: number | null, now: number): string {
  if (ms === null) return "Completed"
  const diff = ms - now
  if (diff <= 0) return "Due now"
  const d = Math.round(diff / DAY)
  if (d === 0) {
    const h = Math.max(1, Math.round(diff / 3_600_000))
    return `in ${h}h`
  }
  if (d === 1) return "tomorrow"
  if (d < 30) return `in ${d} days`
  const mo = Math.round(d / 30)
  return `in ${mo} ${mo === 1 ? "month" : "months"}`
}

const STATE_STYLE: Record<RuleState, { label: string; cls: string }> = {
  due: { label: "Due now", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" },
  scheduled: { label: "Scheduled", cls: "border-primary/30 bg-primary/10 text-primary" },
  paused: { label: "Paused", cls: "border-white/15 bg-white/5 text-muted" },
  done: { label: "Done", cls: "border-white/15 bg-white/5 text-muted" },
}

// Prefer a saved contact's name over the raw short address (Address Book).
function recipientLabel(to: string, contacts: Contact[]): string {
  const known = contactFor(contacts, to)
  return known ? known.label : shortAddr(to)
}

export function AutomationView() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onArc = chainId === arcTestnet.id
  const reduced = useReducedMotion()

  const [rules, setRules] = React.useState<AutomationRule[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [now, setNow] = React.useState(() => Date.now())
  const [showForm, setShowForm] = React.useState(false)

  // Load this wallet's rules + saved contacts on connect / address change.
  React.useEffect(() => {
    if (address) {
      setRules(loadRules(address))
      setContacts(loadContacts(address))
    } else {
      setRules([])
      setContacts([])
    }
  }, [address])

  // Keep "due now" / countdowns live without a reload (cheap 30s tick).
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const persist = React.useCallback(
    (next: AutomationRule[]) => {
      setRules(next)
      if (address) saveRules(address, next)
    },
    [address],
  )

  const add = React.useCallback(
    (draft: RuleDraft) => {
      const id = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
      const rule = createRule(draft, id, new Date().toISOString())
      persist([rule, ...rules])
      setShowForm(false)
    },
    [rules, persist],
  )

  const remove = (id: string) => persist(rules.filter((r) => r.id !== id))
  const toggle = (id: string) =>
    persist(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  // "Mark sent" advances the schedule anchor so the next occurrence is computed
  // forward — the user has signed the handed-off transfer in their wallet.
  const markRun = (id: string) =>
    persist(rules.map((r) => (r.id === id ? { ...r, lastRunAt: new Date().toISOString() } : r)))

  if (!isConnected)
    return (
      <Centered icon={Wallet} title="Connect to schedule payments">
        <p className="text-muted">Automations live with your wallet. You review and sign every payment yourself — AetherFI never holds funds or auto-sends.</p>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </Centered>
    )

  if (!onArc)
    return (
      <Centered title="Switch to Arc Testnet">
        <p className="text-muted">Scheduled payments run on Arc. Approve the prompt to switch.</p>
        <button onClick={() => switchChain?.({ chainId: arcTestnet.id })} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-semibold text-white">
          Switch to Arc
        </button>
      </Centered>
    )

  const sorted = sortRules(rules, now)
  const due = sorted.filter((r) => ruleState(r, now) === "due")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarClock className="h-6 w-6 text-primary" aria-hidden="true" /> Automation
          </h2>
          <p className="mt-1 text-sm text-muted">
            Schedule recurring USDC payments. AetherFI reminds you when one is due and pre-fills the transfer — you always review and sign it yourself.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-glow shrink-0 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> New rule</span>
          </button>
        )}
      </div>

      {/* Honesty banner — no background execution (File 16). */}
      <div className="glass flex items-start gap-3 p-4 text-xs text-muted">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <span>
          AetherFI can&apos;t move funds on its own and doesn&apos;t run in the background. A rule is a smart reminder: when a payment comes due it appears here and on your dashboard, ready for you to send in one tap.
        </span>
      </div>

      {showForm && <RuleForm reduced={reduced} contacts={contacts} onCancel={() => setShowForm(false)} onCreate={add} />}

      {/* Due-now strip */}
      {due.length > 0 && (
        <div className="glass border-emerald-400/20 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {due.length} payment{due.length === 1 ? "" : "s"} due now
          </div>
          <div className="space-y-2">
            {due.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.label}</div>
                  <div className="truncate font-mono text-xs text-muted">{describeRule(r)} → {recipientLabel(r.to, contacts)}</div>
                </div>
                <Link href={runHref(r)} className="btn-glow inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white">
                  <Send className="h-3.5 w-3.5" aria-hidden="true" /> Send
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      {sorted.length === 0 ? (
        <EmptyState onCreate={() => setShowForm(true)} />
      ) : (
        <ul className="space-y-3">
          {sorted.map((r) => (
            <RuleCard
              key={r.id}
              rule={r}
              now={now}
              reduced={reduced}
              contacts={contacts}
              onRun={() => markRun(r.id)}
              onToggle={() => toggle(r.id)}
              onRemove={() => remove(r.id)}
            />
          ))}
        </ul>
      )}

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

function RuleCard({
  rule, now, reduced, contacts, onRun, onToggle, onRemove,
}: {
  rule: AutomationRule; now: number; reduced: boolean; contacts: Contact[]
  onRun: () => void; onToggle: () => void; onRemove: () => void
}) {
  const state = ruleState(rule, now)
  const next = nextDueAt(rule, now)
  const badge = STATE_STYLE[state]
  const known = contactFor(contacts, rule.to)
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
            {rule.cadence === "once" ? <CalendarClock className="h-4 w-4" aria-hidden="true" /> : <Repeat className="h-4 w-4" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">{rule.label}</span>
              <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + badge.cls}>{badge.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm">
              <span className="grad-text font-semibold">{rule.amount} USDC</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              {known ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-foreground">{known.label}</span>
                  <span className="font-mono text-xs text-muted">{shortAddr(rule.to)}</span>
                </span>
              ) : (
                <span className="font-mono text-xs text-muted">{shortAddr(rule.to)}</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {describeRule(rule)} · {state === "paused" ? "paused" : state === "done" ? "completed" : `next ${relDue(next, now)}`}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label={rule.enabled ? "Pause rule" : "Resume rule"} onClick={onToggle}>
            {rule.enabled ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </IconBtn>
          <IconBtn label="Delete rule" onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconBtn>
        </div>
      </div>

      {state === "due" && (
        <div className="mt-3 flex items-center gap-2">
          <Link href={runHref(rule)} className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white">
            <Send className="h-3.5 w-3.5" aria-hidden="true" /> Review &amp; send
          </Link>
          <button onClick={onRun} className="rounded-full border border-white/10 px-3 py-2 text-xs text-muted transition hover:border-primary/30 hover:text-foreground">
            Mark sent
          </button>
        </div>
      )}
    </motion.li>
  )
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "rounded-lg p-2 text-muted transition hover:bg-white/5 " +
        (danger ? "hover:text-red-400" : "hover:text-foreground")
      }
    >
      {children}
    </button>
  )
}

function RuleForm({ reduced, contacts, onCancel, onCreate }: { reduced: boolean; contacts: Contact[]; onCancel: () => void; onCreate: (d: RuleDraft) => void }) {
  const [label, setLabel] = React.useState("")
  const [to, setTo] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [cadence, setCadence] = React.useState<Cadence>("monthly")
  const [startAt, setStartAt] = React.useState(todayLocal())

  // Convert the date input (local yyyy-mm-dd) to an ISO instant for the model.
  const draft: RuleDraft = { label, to, amount, cadence, startAt: new Date(startAt + "T12:00:00").toISOString() }
  const v = validateRule(draft)

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass space-y-4 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">New scheduled payment</div>
        <button onClick={onCancel} aria-label="Cancel" className="rounded-lg p-1.5 text-muted hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rent, payroll, subscription…"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Recipient address</span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x…"
          aria-invalid={to.length > 0 && !v.toValid}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
        />
        {to.length > 0 && !v.toValid && <span className="mt-1 block text-xs text-red-400">Enter a valid 0x address.</span>}

        {/* Contact picker — pick a saved recipient instead of typing an address */}
        {sortContacts(contacts).slice(0, 5).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setTo(c.address)}
            className={
              "mt-2 mr-1.5 inline-flex rounded-full border px-2.5 py-1 text-xs transition-colors " +
              (to.toLowerCase() === c.address
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-white/10 text-muted hover:border-white/25 hover:text-foreground")
            }
          >
            {c.label}
          </button>
        ))}
        {contacts.length > 5 && (
          <Link href="/contacts" className="ml-0.5 mt-2 inline-block text-xs text-muted underline transition hover:text-foreground">+{contacts.length - 5} more</Link>
        )}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Amount (USDC)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-invalid={amount.length > 0 && !v.amtValid}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
          />
          {amount.length > 0 && !v.amtValid && <span className="mt-1 block text-xs text-red-400">Enter an amount greater than zero.</span>}
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Starts</span>
          <input
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </div>

      <div className="block text-sm">
        <span className="mb-1.5 block text-muted">Repeat</span>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Cadence">
          {CADENCES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCadence(c.value)}
              aria-pressed={cadence === c.value}
              className={
                "rounded-xl border px-2 py-2 text-xs font-medium transition " +
                (cadence === c.value
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-white/10 text-muted hover:border-white/20 hover:text-foreground")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="rounded-full border border-white/10 px-5 py-2 text-sm text-muted transition hover:text-foreground">Cancel</button>
        <button
          onClick={() => v.ready && onCreate(draft)}
          disabled={!v.ready}
          className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Schedule payment
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass flex flex-col items-center gap-4 p-10 text-center">
      <div className="floaty text-primary"><CalendarClock className="h-10 w-10" aria-hidden="true" /></div>
      <div>
        <div className="text-lg font-semibold">No scheduled payments yet</div>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Set up rent, payroll, or a recurring transfer once. AetherFI reminds you the moment each one is due — you stay in full control of signing.
        </p>
      </div>
      <button onClick={onCreate} className="btn-glow rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white">
        <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> Create your first rule</span>
      </button>
    </div>
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
