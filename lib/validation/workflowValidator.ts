import type { WorkflowNodeModel } from "@/models/workflow";

export interface ValidationError {
  nodeId: string;
  message: string;
}

export function validateWorkflowNode(node: WorkflowNodeModel): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node.title || !node.title.trim()) {
    errors.push({
      nodeId: node.id,
      message: "Node title is required.",
    });
  }

  const descriptionText = node.description?.trim() ?? "";
  if (!descriptionText) {
    errors.push({
      nodeId: node.id,
      message: "Node description is required.",
    });
  }

  return errors;
}