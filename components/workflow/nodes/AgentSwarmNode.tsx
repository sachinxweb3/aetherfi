"use client"

import * as React from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { BrainCircuit, Shield, ArrowRightLeft, HardDrive } from "lucide-react"

export interface AgentSwarmNodeData extends Record<string, unknown> {
  label: string
  nodeType: "INTENT" | "ZK_SHIELD" | "BRIDGE" | "DEPIN"
  status: "ACTIVE" | "EXECUTING" | "IDLE"
  details: string
}

export type AgentSwarmCustomNode = Node<AgentSwarmNodeData, "agentSwarm">

export function AgentSwarmNode({ data }: NodeProps<AgentSwarmCustomNode>) {
  const getIcon = () => {
    switch (data.nodeType) {
      case "INTENT":
        return <BrainCircuit className="h-4 w-4 text-indigo-400" />
      case "ZK_SHIELD":
        return <Shield className="h-4 w-4 text-emerald-400" />
      case "BRIDGE":
        return <ArrowRightLeft className="h-4 w-4 text-purple-400" />
      case "DEPIN":
        return <HardDrive className="h-4 w-4 text-amber-400" />
      default:
        return <BrainCircuit className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="min-w-[220px] rounded-2xl border border-border/60 bg-card/90 p-4 backdrop-blur-xl shadow-2xl transition-all hover:border-primary/50">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-primary !border-2 !border-background"
      />

      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/60 border border-border/50">
          {getIcon()}
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">{data.label}</h4>
          <span className="text-[10px] font-mono text-muted-foreground">{data.details}</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">State:</span>
        <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {data.status}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-primary !border-2 !border-background"
      />
    </div>
  )
}