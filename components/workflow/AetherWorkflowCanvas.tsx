"use client"

import * as React from "react"
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AgentSwarmNode, type AgentSwarmCustomNode } from "@/components/workflow/nodes/AgentSwarmNode"
import { Network, Play, Sparkles } from "lucide-react"

const nodeTypes = {
  agentSwarm: AgentSwarmNode,
}

const initialNodes: AgentSwarmCustomNode[] = [
  {
    id: "1",
    type: "agentSwarm",
    position: { x: 250, y: 20 },
    data: {
      label: "AI Intent Engine",
      nodeType: "INTENT",
      status: "ACTIVE",
      details: "Natural Language Parser",
    },
  },
  {
    id: "2",
    type: "agentSwarm",
    position: { x: 80, y: 160 },
    data: {
      label: "ZK Stealth Shield",
      nodeType: "ZK_SHIELD",
      status: "ACTIVE",
      details: "EIP-5564 Privacy Vault",
    },
  },
  {
    id: "3",
    type: "agentSwarm",
    position: { x: 420, y: 160 },
    data: {
      label: "LayerZero Bridge Router",
      nodeType: "BRIDGE",
      status: "ACTIVE",
      details: "OApp Cross-Chain Relay",
    },
  },
  {
    id: "4",
    type: "agentSwarm",
    position: { x: 250, y: 300 },
    data: {
      label: "DePIN Compute Node",
      nodeType: "DEPIN",
      status: "ACTIVE",
      details: "Hardware Telemetry Vault",
    },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#10b981", strokeWidth: 2 } },
  { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "#c084fc", strokeWidth: 2 } },
  { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "#f59e0b", strokeWidth: 2 } },
  { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#f59e0b", strokeWidth: 2 } },
]

export function AetherWorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Spatial AI Workflow Graph</h3>
            <p className="text-xs text-muted-foreground">Interactive React Flow Node Canvas for Agentic Pipeline Swarms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Swarm Orchestrator Online
          </span>
        </div>
      </div>

      <div className="mt-6 h-[420px] w-full rounded-xl border border-border/50 bg-background/80 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls className="!border-border/60 !bg-card/80 !text-foreground !rounded-lg" />
        </ReactFlow>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Drag nodes to re-orient financial intent workflows dynamically
        </span>
        <span className="font-mono text-[11px]">Nodes: 4 Active | Edges: 4 Connected</span>
      </div>
    </div>
  )
}