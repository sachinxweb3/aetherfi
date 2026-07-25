import type { WorkflowModel } from "@/models/workflow";

export function renameNode(
  workflow: WorkflowModel,
  nodeId: string,
  title: string,
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            title,
          }
        : node,
    ),
  };
}

export function updateNodeState(
  workflow: WorkflowModel,
  nodeId: string,
  state: WorkflowModel["nodes"][number]["state"],
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            state,
          }
        : node,
    ),
  };
}

export function moveNode(
  workflow: WorkflowModel,
  nodeId: string,
  position: {
    x: number;
    y: number;
  },
): WorkflowModel {
  return {
    ...workflow,
    layout: {
      ...workflow.layout,
      nodes: workflow.layout.nodes.map((layoutNode) =>
        layoutNode.id === nodeId
          ? {
              ...layoutNode,
              position,
            }
          : layoutNode,
      ),
    },
  };
}