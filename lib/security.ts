import type { ArcTx } from "@/lib/arc"
import { successRate } from "@/lib/analytics"

// Wallet Security Checkup — a deterministic, rule-based audit over the SAME
// on-chain data the rest of the app already fetches (File 06 intelligence,
// File 16 honesty). It never fabricates a threat it cannot see: approval calls
// are detected from the transaction method, but we state plainly that the
// remaining allowance amount is NOT readable from this view. Pure + sync, no
// network, no paid model.

export type CheckStatus = "pass" | "warn" | "fail" | "info"

export interface SecurityCheck {
  id: string
  label: string // short title
  status: CheckStatus
  detail: string // plain-English finding
  icon: string // Lucide registry key resolved at render time
  score: number // 0..1 contribution to the overall grade
  weight: number // relevance weight; 0 = informational, excluded from grade
}

export interface SecurityReport {
  score: number // 0..100 overall posture
  grade: string // human label for the score
  checks: SecurityCheck[] // ordered: most urgent first
  summary: string // one-line honest headline
  sampleSize: number // number of recent transactions the checkup covered
}

// Narrow, testable input — mapped from WalletKundli + ArcTx[] by the view so
// tests don't need to build a whole kundli object.
export interface SecurityInput {
  address: string
  walletAgeDays: number
  isContract: boolean
  lastTxDate: string | null
  txs: ArcTx[]
}

const DAY = 86400000

// Count recent transactions that call an approval method. We match the method
// name only — we deliberately do NOT claim to know the allowance amount.
function approvalCount(txs: ArcTx[]): number {
  return txs.filter((t) => t.method != null && /approv/i.test(t.method)).length
}

// Share (0..1) of total outgoing value that went to the single largest
// recipient. Returns null when there is no outgoing value to analyze.
function outflowConcentration(txs: ArcTx[], self: string): number | null {
  const me = self.toLowerCase()
  const byDest = new Map<string, number>()
  let total = 0
  for (const t of txs) {
    if (t.direction !== "out" || t.valueUSDC <= 0) continue
    const dest = (t.to ?? "unknown").toLowerCase()
    if (dest === me) continue
    byDest.set(dest, (byDest.get(dest) ?? 0) + t.valueUSDC)
    total += t.valueUSDC
  }
  if (total <= 0) return null
  const top = Math.max(...byDest.values())
  return top / total
}

// Build the ordered list of checks. `nowMs` is injectable for deterministic
// tests (dormancy depends on the current time).
export function securityChecks(input: SecurityInput, nowMs: number = Date.now()): SecurityCheck[] {
  const { txs } = input
  const checks: SecurityCheck[] = []

  // 1) Token-approval exposure — the highest-value on-chain security signal.
  //    With no transactions there's nothing to inspect, so it's informational.
  if (txs.length === 0) {
    checks.push({
      id: "approvals",
      label: "Token approval exposure",
      status: "info",
      score: 0,
      weight: 0,
      icon: "info",
      detail: "No transactions yet, so there are no approval calls to review. Approvals grant contracts standing permission to move your tokens.",
    })
  } else {
    const approvals = approvalCount(txs)
    checks.push({
      id: "approvals",
      label: "Token approval exposure",
      weight: 0.25,
      ...(approvals === 0
        ? {
            status: "pass" as const,
            score: 1,
            icon: "shield-check",
            detail: "No approval calls in your recent transactions. Approvals grant contracts standing permission to move your tokens.",
          }
        : {
            status: "warn" as const,
            score: approvals >= 3 ? 0.2 : 0.5,
            icon: "shield-alert",
            detail: `${approvals} approval ${approvals === 1 ? "call" : "calls"} found in recent activity. Each is a standing permission — the remaining allowance amount can't be read from this view, so review and revoke any you no longer need.`,
          }),
    })
  }

  // 2) Transaction hygiene — a high failure rate can signal interaction with
  //    broken or hostile contracts.
  if (txs.length === 0) {
    checks.push({
      id: "hygiene",
      label: "Transaction hygiene",
      status: "info",
      score: 0,
      weight: 0,
      icon: "info",
      detail: "No transactions yet to analyze. Signals will appear here as you use your wallet.",
    })
  } else {
    const rate = successRate(txs)
    checks.push({
      id: "hygiene",
      label: "Transaction hygiene",
      weight: 0.2,
      ...(rate >= 95
        ? { status: "pass" as const, score: 1, icon: "shield-check", detail: `${rate}% of your recent transactions succeeded. Clean execution history.` }
        : rate >= 80
          ? { status: "warn" as const, score: 0.5, icon: "shield-alert", detail: `${rate}% success rate. A few failures are normal, but repeated failures can mean a contract is rejecting your calls.` }
          : { status: "fail" as const, score: 0, icon: "shield-x", detail: `Only ${rate}% of recent transactions succeeded. Frequent failures may indicate a broken or hostile contract — inspect what you're interacting with.` }),
    })
  }

  // 3) Wallet maturity — established wallets are harder to impersonate. A brand
  //    new wallet isn't penalized (weight 0) — youth is a note, not a fault.
  const age = input.walletAgeDays
  checks.push({
    id: "maturity",
    label: "Wallet maturity",
    ...(age >= 30
      ? { weight: 0.15, status: "pass" as const, score: 1, icon: "shield-check", detail: `Active for ${age} days. Established wallets are harder for scammers to spoof.` }
      : age >= 7
        ? { weight: 0.15, status: "warn" as const, score: 0.6, icon: "shield-alert", detail: `${age} days old. Still building history — be extra cautious with approvals and unknown contracts.` }
        : { weight: 0, status: "info" as const, score: 0, icon: "info", detail: `New wallet (${age} ${age === 1 ? "day" : "days"}). Take care with early approvals; treat unsolicited transfers as suspicious.` }),
  })

  // 4) Fund-outflow concentration — most outgoing value going to one address is
  //    normal for a single counterparty, but worth surfacing.
  const conc = outflowConcentration(txs, input.address)
  if (conc == null) {
    checks.push({
      id: "concentration",
      label: "Outflow concentration",
      status: "info",
      score: 0,
      weight: 0,
      icon: "info",
      detail: "No outgoing transfers to analyze in your recent history.",
    })
  } else {
    const pct = Math.round(conc * 100)
    checks.push({
      id: "concentration",
      label: "Outflow concentration",
      weight: 0.2,
      ...(conc <= 0.6
        ? { status: "pass" as const, score: 1, icon: "shield-check", detail: `Your outgoing value is spread across recipients (top destination is ${pct}%). Lower concentration limits single-point exposure.` }
        : conc <= 0.85
          ? { status: "warn" as const, score: 0.5, icon: "shield-alert", detail: `${pct}% of your outgoing value went to one address. Fine if that's a known counterparty — confirm it's yours or trusted.` }
          : { status: "warn" as const, score: 0.3, icon: "shield-alert", detail: `${pct}% of outgoing value went to a single address. Double-check it's an address you intend to keep funding.` }),
    })
  }

  // 5) Dormancy — long-idle wallets are common phishing targets on reactivation.
  const last = input.lastTxDate ? Date.parse(input.lastTxDate) : NaN
  if (!Number.isFinite(last)) {
    checks.push({
      id: "dormancy",
      label: "Recent activity",
      status: "info",
      score: 0,
      weight: 0,
      icon: "info",
      detail: "No dated activity found to assess dormancy.",
    })
  } else {
    const idleDays = Math.max(0, Math.floor((nowMs - last) / DAY))
    checks.push({
      id: "dormancy",
      label: "Recent activity",
      weight: 0.2,
      ...(idleDays <= 30
        ? { status: "pass" as const, score: 1, icon: "shield-check", detail: `Last active ${idleDays === 0 ? "today" : `${idleDays} day${idleDays === 1 ? "" : "s"} ago`}. Actively-used wallets are easier to keep secure.` }
        : idleDays <= 90
          ? { status: "warn" as const, score: 0.5, icon: "shield-alert", detail: `Idle for ${idleDays} days. Re-check your approvals and holdings before resuming activity.` }
          : { status: "warn" as const, score: 0.2, icon: "shield-alert", detail: `Dormant for ${idleDays} days. Dormant wallets are frequent phishing targets on reactivation — verify every prompt carefully.` }),
    })
  }

  // 6) Account type — informational context, never scored.
  checks.push({
    id: "account-type",
    label: "Account type",
    status: "info",
    score: 0,
    weight: 0,
    icon: "info",
    detail: input.isContract
      ? "This address is a contract. Contract accounts follow different security rules than externally-owned wallets."
      : "Standard externally-owned account (EOA), secured by your private key. Never share your seed phrase.",
  })

  // Most urgent first: fail, then warn, then pass, then info; higher weight wins ties.
  const rank: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2, info: 3 }
  return checks.sort((a, b) => rank[a.status] - rank[b.status] || b.weight - a.weight)
}

// Weighted overall posture, 0..100. Only weighted (non-informational) checks
// count. Returns 0 when nothing is scorable yet.
export function overallScore(checks: SecurityCheck[]): number {
  const scored = checks.filter((c) => c.weight > 0)
  const totalWeight = scored.reduce((s, c) => s + c.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = scored.reduce((s, c) => s + c.score * c.weight, 0)
  return Math.round((weighted / totalWeight) * 100)
}

export function securityGrade(score: number): string {
  if (score >= 85) return "Strong"
  if (score >= 65) return "Fair"
  if (score >= 40) return "Needs attention"
  return "At risk"
}

// Full report: checks, weighted score, grade, and an honest one-line summary.
export function securityReport(input: SecurityInput, nowMs: number = Date.now()): SecurityReport {
  const checks = securityChecks(input, nowMs)
  const scorable = checks.some((c) => c.weight > 0)
  const score = overallScore(checks)
  const grade = securityGrade(score)
  const issues = checks.filter((c) => c.status === "warn" || c.status === "fail").length
  const summary = !scorable
    ? "Not enough on-chain history yet to assess your wallet's security posture."
    : issues === 0
      ? "No security concerns found in your recent on-chain activity."
      : `${issues} thing${issues === 1 ? "" : "s"} worth reviewing in your recent on-chain activity.`
  return { score, grade, checks, summary, sampleSize: input.txs.length }
}
