"use client";

import { useMemo } from "react";
import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";

import CanvasToolbar from "./CanvasToolbar";
import InspectorPanel from "@/components/inspector/InspectorPanel";
import { useInteractionState } from "@/hooks/useInteractionState";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useWorkflowSync } from "@/hooks/useWorkflowSync";
import { edgeTypes } from "./config/edgeTypes";
import { initialEdges } from "./config/initialEdges";
import { initialNodes } from "./config/initialNodes";
import { nodeTypes } from "./config/nodeTypes";

export default function FlowCanvas() {
  const [interaction, setInteraction] = useInteractionState();
  const {
    workflow,
    selectedNodeId,
    selectNode,
  } = useWorkflow();
  const { nodes: workflowNodes } = useWorkflowSync(workflow);

  // Dynamic compatibility source for workflow nodes
  const canvasSourceNodes =
    workflowNodes.length > 0 ? workflowNodes : initialNodes;

  // Compute node states from Store execution OR Hover interaction
  const nodes = useMemo(() => {
    const isExecutionRunning = workflow.executionState === "running";

    // Compute hovered node index for fallback hover simulation
    const hoveredIndex = canvasSourceNodes.findIndex(
      (node) => node.id === interaction.hoveredNodeId,
    );

    return canvasSourceNodes.map((node, index) => {
      // Find matching state from workflowStore
      const storeNode = workflow.nodes.find((n) => n.id === node.id);
      let state = storeNode?.state ?? "idle";

      // Fallback to hover logic only if execution engine is NOT running
      if (!isExecutionRunning && hoveredIndex >= 0) {
        if (index < hoveredIndex) {
          state = "success";
        } else if (index === hoveredIndex) {
          state = "active";
        } else {
          state = "idle";
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          state,
          selected: selectedNodeId === node.id,
        },
      };
    });
  }, [canvasSourceNodes, workflow.nodes, workflow.executionState, interaction.hoveredNodeId, selectedNodeId]);

  // Compute active vs. idle state for connected edges dynamically
  const edges = useMemo(() => {
    return initialEdges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      const isActive =
        sourceNode?.data?.state === "active" ||
        targetNode?.data?.state === "active" ||
        (sourceNode?.data?.state === "success" && targetNode?.data?.state === "active");

      const isSuccess =
        sourceNode?.data?.state === "success" && targetNode?.data?.state === "success";

      return {
        ...edge,
        data: {
          ...edge.data,
          state: isSuccess ? "success" : isActive ? "active" : "idle",
        },
      };
    });
  }, [initialEdges, nodes]);

  return (
    <div className="space-y-4">
      <CanvasToolbar />

      <div className="flex gap-6">
        <div className="h-[600px] flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white to-slate-50 shadow-xl backdrop-blur-xl dark:from-neutral-900 dark:to-neutral-950">
          <ReactFlow
            fitView
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeMouseEnter={(_, node) =>
              setInteraction((prev) => ({
                ...prev,
                hoveredNodeId: node.id,
              }))
            }
            onNodeMouseLeave={() =>
              setInteraction((prev) => ({
                ...prev,
                hoveredNodeId: null,
              }))
            }
            onNodeClick={(_, node) => selectNode(node.id)}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            panOnDrag={false}
          >
            <MiniMap />
            <Controls />
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.5}
            />
          </ReactFlow>
        </div>

        <InspectorPanel />
      </div>
    </div>
  );
}