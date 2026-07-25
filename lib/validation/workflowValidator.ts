import type {
  WorkflowModel,
  WorkflowNodeModel,
} from "@/models/workflow";

export interface WorkflowValidationError {
  nodeId: string;
  message: string;
}

function validateNode(
  node: WorkflowNodeModel,
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  if (!node.title.trim()) {
    errors.push({
      nodeId: node.id,
      message: "Node title is required.",
    });
  }

  if (!node.description.trim()) {
    errors.push({
      nodeId: node.id,
      message: "Node description is required.",
    });
  }

  return errors;
}

export function validateWorkflow(
  workflow: WorkflowModel,
): WorkflowValidationError[] {
  return workflow.nodes.flatMap(validateNode);
}