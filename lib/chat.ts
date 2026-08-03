import type { WalletKundli, ArcTx } from "@/lib/arc"
import { askAether, classifyInContext, type AskIntent } from "@/lib/askAether"
import { parseCommand, resolveCommand, type Command, type CommandContact } from "@/lib/command"

// Chat orchestration for the AI Workspace (File 05). Decides, per question,
// whether AETHER can answer it locally & deterministically from wallet data
// (instant, free, honest) or should defer to the /api/assistant route for
// open-ended Arc/how-to questions. Carries the previous turn's intent so short
// follow-ups ("and received?", "why?") resolve in context. Pure decision + a
// thin async resolver.

export interface ChatTurn {
  role: "user" | "aether"
  text: string
  source: "local" | "ai" | "pending"
  href?: string
  command?: Command
  intent?: AskIntent // resolved wallet-data intent, so the NEXT turn has context
}

// A question is answered locally when it maps to a known wallet-data intent —
// evaluated IN CONTEXT so a follow-up that inherits a local intent stays local.
// "help"/"unknown" are open-ended → better served by the assistant route.
export function isLocalIntent(question: string, prevIntent: AskIntent | null = null): boolean {
  const intent = classifyInContext(question, prevIntent)
  return intent !== "unknown" && intent !== "help"
}

// Resolve a transfer recipient to a saved contact's label, if any — used to
// keep confirm-action copy human-friendly instead of raw hex.
export function contactLabel(address: string, contacts: CommandContact[]): string | null {
  const a = address.toLowerCase()
  const c = contacts.find((x) => x.address.toLowerCase() === a)
  return c ? c.label : null
}

// Resolve a question to a completed aether turn. Local intents answer
// synchronously; everything else calls the assistant API, falling back to the
// local help text if the network fails so we always respond (File 16 honesty).
// prevIntent (from the last aether turn) powers multi-turn follow-ups.
export async function resolveTurn(
  k: WalletKundli,
  txs: ArcTx[],
  question: string,
  fetchImpl: typeof fetch = fetch,
  prevIntent: AskIntent | null = null,
  contacts: CommandContact[] = []
): Promise<ChatTurn> {
  // 1. Agentic command? Surface a confirm-action card (never auto-execute).
  //    Try the contact-aware resolver first ("send 5 to Alice" / named saves),
  //    then fall back to the plain address parser.
  const command = resolveCommand(question, contacts) ?? parseCommand(question)
  if (command) {
    const recipient =
      command.kind === "transfer"
        ? contactLabel(command.to, contacts) ?? `${command.to.slice(0, 10)}…${command.to.slice(-6)}`
        : ""
    const text =
      command.kind === "transfer"
        ? `Ready to send ${command.amount} USDC to ${recipient}. Review and sign in your wallet — I never move funds for you.`
        : `Sure — ${command.label.toLowerCase()}.`
    return { role: "aether", text, source: "local", command }
  }

  // 2. Wallet-data question (in context)? Answer locally & deterministically.
  if (isLocalIntent(question, prevIntent)) {
    const a = askAether(k, txs, question, prevIntent)
    return { role: "aether", text: a.text, source: "local", href: a.href, intent: a.intent }
  }
  try {
    const res = await fetchImpl("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: question,
        context: {
          rank: k.rank, score: k.score, txCount: k.txCount,
          balanceUSDC: k.balanceUSDC, walletAgeDays: k.walletAgeDays,
        },
      }),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = (await res.json()) as { reply?: string; source?: string }
    if (!data.reply) throw new Error("empty reply")
    return { role: "aether", text: data.reply, source: data.source === "ai" ? "ai" : "local" }
  } catch {
    const a = askAether(k, txs, question, prevIntent)
    return { role: "aether", text: a.text, source: "local", href: a.href, intent: a.intent }
  }
}
