import type { WorkflowModel, WorkflowNodeState } from "@/models/workflow";

export function renameWorkflowNode(
  workflow: WorkflowModel,
  nodeId: string,
  newTitle: string
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, title: newTitle } : node
    ),
  };
}

export function updateWorkflowNodeDescription(
  workflow: WorkflowModel,
  nodeId: string,
  newDescription: string
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, description: newDescription } : node
    ),
  };
}

export function updateWorkflowNodeState(
  workflow: WorkflowModel,
  nodeId: string,
  newState: WorkflowNodeState
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, state: newState } : node
    ),
  };
}

export function updateWorkflowNodeSettings(
  workflow: WorkflowModel,
  nodeId: string,
  settingsPatch: Record<string, unknown>
): WorkflowModel {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            settings: {
              ...node.settings,
              ...settingsPatch,
            },
          }
        : node
    ),
  };
}

export function updateWorkflowNodePosition(
  workflow: WorkflowModel,
  nodeId: string,
  position: { x: number; y: number }
): WorkflowModel {
  if (!workflow.layout) {
    return workflow;
  }

  return {
    ...workflow,
    layout: {
      ...workflow.layout,
      nodes: (workflow.layout.nodes || []).map((layoutNode) =>
        layoutNode.id === nodeId
          ? {
              ...layoutNode,
              position,
            }
          : layoutNode
      ),
    },
  };
}