import type { Node } from "@xyflow/react";

import type { WorkflowModel } from "@/models/workflow";
import type { FlowNodeData } from "@/components/flow/types/FlowNodeData";
import { presentationRegistry } from "@/components/flow/config/presentationRegistry";

export function useCanvasAdapter(
  workflow: WorkflowModel,
): Node<FlowNodeData>[] {
  return workflow.nodes.map((node, index) => {
    const layout = workflow.layout.nodes.find(
      (item) => item.id === node.id,
    );

    return {
      id: node.id,

      type:
        presentationRegistry[node.id]?.type ??
        "decision",

      position: layout?.position ?? {
        x: index * 300,
        y: 140,
      },

      data: {
        title: node.title,
        subtitle:
          presentationRegistry[node.id]?.subtitle ??
          "",
        variant:
          presentationRegistry[node.id]?.variant ??
          "wallet",
        state: node.state,
      },
    };
  });
}