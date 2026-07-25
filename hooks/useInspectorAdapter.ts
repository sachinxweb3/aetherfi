import type { WorkflowModel, WorkflowNodeModel } from "@/models/workflow";

export function useInspectorAdapter(
  workflow: WorkflowModel,
  selectedNodeId: string | null,
): WorkflowNodeModel | null {
  if (!selectedNodeId) {
    return null;
  }

  return (
    workflow.nodes.find((node) => node.id === selectedNodeId) ?? null
  );
}