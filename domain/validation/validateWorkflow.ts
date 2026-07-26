import type { WorkflowModel } from "@/models/workflow";

import {
  validateNode,
  type ValidationResult,
} from "./validateNode";

export interface WorkflowValidationResult {
  nodeId: string;
  results: ValidationResult[];
}

export function validateWorkflow(
  workflow: WorkflowModel,
): WorkflowValidationResult[] {
  return workflow.nodes.map((node) => ({
    nodeId: node.id,
    results: validateNode(node),
  }));
}