import { Node } from "@xyflow/react";
import type { FlowNodeData } from "@/components/flow/types/FlowNodeData";
import type { WorkflowModel } from "@/models/workflow";

export function useCanvasAdapter(
  workflow: WorkflowModel
): Node<FlowNodeData>[] {
  // Mapping nodes with exact visual types, accents and horizontal layout
  const nodeTypeMap: Record<
    string,
    { type: string; variant: "wallet" | "review" | "risk" | "approval" | "success" }
  > = {
    wallet: { type: "start", variant: "wallet" },
    review: { type: "decision", variant: "review" },
    risk: { type: "action", variant: "risk" },
    approval: { type: "decision", variant: "approval" },
    success: { type: "success", variant: "success" },
  };

  return workflow.nodes.map((node, index) => {
    const mapped = nodeTypeMap[node.id] || {
      type: "start",
      variant: "wallet",
    };

    const layout = workflow.layout?.nodes?.find(
      (item) => item.id === node.id
    );

    // Horizontal positions: X-axis spacing between 320px
    const defaultX = index * 320;
    const defaultY = 0;

    return {
      id: node.id,
      type: mapped.type,
      position: layout?.position ?? { x: defaultX, y: defaultY },
      data: {
        title: node.title,
        subtitle: node.description ?? "",
        variant: mapped.variant,
        state: node.state,
      },
    };
  });
}