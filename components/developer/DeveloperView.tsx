"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Code2, Terminal, Bot, Copy, Check, ArrowUpRight, Wrench, ShieldCheck, Wallet,
} from "lucide-react"
import { useAccount } from "wagmi"
import {
  API_ENDPOINTS, MCP_TOOLS, SAMPLE_ADDRESS,
  endpointUrl, curlFor, mcpConfig, mcpCurl,
  type ApiEndpoint, type McpTool,
} from "@/lib/developer"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Developer — AETHER's public API + MCP integration surface, promoted from the
// landing-page builder mode into a first-class app route (File 08). Everything
// shown mirrors the real /api/* endpoints and the MCP server's real tools
// (File 16). Copy-paste snippets use your connected wallet when available.

function useOrigin(): string {
  const [origin, setOrigin] = React.useState("https://aetherfi.vercel.app")
  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])
  return origin
}

function useCopy(): [string, (id: string, text: string) => void] {
  const [copied, setCopied] = React.useState("")
  const copy = React.useCallback((id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(""), 1600)
    }).catch(() => {})
  }, [])
  return [copied, copy]
}

export function DeveloperView() {
  const { address, isConnected } = useAccount()
  const origin = useOrigin()
  const reduced = useReducedMotion()
  const [copied, copy] = useCopy()

  const values = React.useMemo<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    if (isConnected && address) v.address = address
    return v
  }, [isConnected, address])
  const shownAddress = isConnected && address ? address : SAMPLE_ADDRESS

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Code2 className="h-6 w-6 text-primary" aria-hidden="true" /> Developer
        </h2>
        <p className="mt-1 text-sm text-muted">
          AetherFI&apos;s data is open. Query any Arc wallet over a free public API, or connect the MCP server to Claude and other AI
          clients. No API key, no rate-limit games — reads are free and safe.
        </p>
      </div>

      {/* Context banner: which address the snippets target */}
      <div className="glass flex items-center gap-3 p-4 text-sm">
        <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {isConnected && address ? (
          <span className="text-muted">
            Snippets below target your wallet <span className="font-mono text-foreground">{address.slice(0, 8)}…{address.slice(-6)}</span>.
          </span>
        ) : (
          <span className="text-muted">Connect a wallet to target your own address — examples use a sample address for now.</span>
        )}
      </div>

      {/* Public API */}
      <Section icon={Terminal} title="Public API" reduced={reduced}>
        <p className="mb-4 text-sm text-muted">Plain GET requests return JSON. Drop these into any language, no auth required.</p>
        <div className="space-y-3">
          {API_ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.id} ep={ep} origin={origin} values={values} copied={copied} copy={copy} />
          ))}
        </div>
      </Section>

      {/* MCP integration */}
      <Section icon={Bot} title="Connect from Claude or ChatGPT" reduced={reduced}>
        <p className="mb-4 text-sm text-muted">
          AetherFI speaks the Model Context Protocol. Add this to your AI client config, then ask about any Arc wallet in plain
          language. Any transaction is <span className="font-semibold text-foreground">prepared for you to sign yourself</span> — AetherFI never holds keys or signs.
        </p>
        <CodeBlock
          id="mcp-config"
          label="MCP client config"
          code={mcpConfig(origin)}
          copied={copied}
          copy={copy}
        />

        <div className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Available tools</div>
        <div className="space-y-2">
          {MCP_TOOLS.map((t) => (
            <ToolRow key={t.name} tool={t} />
          ))}
        </div>

        <div className="mt-5">
          <CodeBlock
            id="mcp-curl"
            label="Try a tool call over HTTP"
            code={mcpCurl(origin, shownAddress)}
            copied={copied}
            copy={copy}
          />
        </div>
      </Section>

      {/* Safety note */}
      <div className="glass flex items-start gap-3 p-5 text-xs text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Every endpoint and tool here is read-only or prepare-only. AetherFI never asks for a private key or seed phrase, never
          signs, and never moves funds — a transfer is always handed back unsigned for you to review in your own wallet.
        </span>
      </div>

      <Link href="/dashboard" className="inline-block text-sm text-muted underline">← Back to dashboard</Link>
    </div>
  )
}

function EndpointCard({
  ep, origin, values, copied, copy,
}: {
  ep: ApiEndpoint; origin: string; values: Record<string, string>
  copied: string; copy: (id: string, text: string) => void
}) {
  const url = endpointUrl(origin, ep, values)
  const curl = curlFor(origin, ep, values)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{ep.method}</span>
        <span className="font-mono text-sm text-foreground">{ep.path}</span>
        <span className="ml-auto text-xs text-muted">{ep.title}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted">{ep.detail}</p>
      {ep.params.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ep.params.map((p) => (
            <span key={p.name} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted">
              <span className="font-mono text-foreground">{p.name}</span>{p.required ? " · required" : " · optional"}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => copy(ep.id, curl)}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-left font-mono text-xs transition hover:border-primary/40"
      >
        <span className="truncate">curl &quot;{url}&quot;</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-accent">
          {copied === ep.id ? <><Check className="h-3.5 w-3.5" aria-hidden="true" /> copied</> : <><Copy className="h-3.5 w-3.5" aria-hidden="true" /> copy</>}
        </span>
      </button>
    </div>
  )
}

function ToolRow({ tool }: { tool: McpTool }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-foreground">{tool.name}</span>
          {tool.writes ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">prepares tx · you sign</span>
          ) : (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">read-only</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted">{tool.detail}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tool.params.map((p) => (
            <span key={p.name} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted">
              <span className="font-mono text-foreground">{p.name}</span>{p.required ? " · required" : " · optional"}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function CodeBlock({
  id, label, code, copied, copy,
}: {
  id: string; label: string; code: string; copied: string; copy: (id: string, text: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        <button
          onClick={() => copy(id, code)}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted transition hover:border-primary/40 hover:text-foreground"
        >
          {copied === id ? <><Check className="h-3 w-3" aria-hidden="true" /> copied</> : <><Copy className="h-3 w-3" aria-hidden="true" /> copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-foreground/90">{code}</pre>
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
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
        <ArrowUpRight className="h-3.5 w-3.5 text-muted/40" aria-hidden="true" />
      </div>
      <div className="mt-3">{children}</div>
    </motion.section>
  )
}
