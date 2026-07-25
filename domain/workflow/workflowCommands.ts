import type {
  WorkflowModel,
  WorkflowNodeSettings,
  WorkflowNodeState,
} from "@/models/workflow";

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

export function updateNodeDescription(
  workflow: WorkflowModel,
  nodeId: string,
  description: string,
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            description,
          }
        : node,
    ),
  };
}

export function updateNodeState(
  workflow: WorkflowModel,
  nodeId: string,
  state: WorkflowNodeState,
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

export function updateNodeSettings(
  workflow: WorkflowModel,
  nodeId: string,
  settings: Partial<WorkflowNodeSettings>,
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            settings: {
              ...node.settings,
              ...settings,
            },
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
  const exists = workflow.layout.nodes.some(
    (item) => item.id === nodeId,
  );

  const updatedLayoutNodes = exists
    ? workflow.layout.nodes.map((item) =>
        item.id === nodeId
          ? {
              ...item,
              position,
            }
          : item,
      )
    : [
        ...workflow.layout.nodes,
        {
          id: nodeId,
          position,
        },
      ];

  return {
    ...workflow,
    layout: {
      ...workflow.layout,
      nodes: updatedLayoutNodes,
    },
  };
}