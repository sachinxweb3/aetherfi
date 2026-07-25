import { Node } from "@xyflow/react";
import type { FlowNodeData } from "@/components/flow/types/FlowNodeData";
import type { WorkflowModel } from "@/models/workflow";

export function useCanvasAdapter(
  workflow: WorkflowModel
): Node<FlowNodeData>[] {
  return workflow.nodes.map((node, index) => {
    const layout = workflow.layout?.nodes?.find(
      (item) => item.id === node.id
    );

    return {
      id: node.id,
      type: "start",
      position: layout?.position ?? { x: 250, y: index * 150 },
      data: {
        title: node.title,
        subtitle: node.description ?? "",
        variant: "wallet",
        state: node.state,
      },
    };
  });
}