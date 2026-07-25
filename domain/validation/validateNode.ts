import type { WorkflowNodeModel } from "@/models/workflow";

export interface ValidationResult {
  field: string;
  status: "error" | "warning" | "success";
  message: string;
}

export function validateNode(node: WorkflowNodeModel): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Title validation
  if (!node.title || node.title.trim().length === 0) {
    results.push({
      field: "title",
      status: "error",
      message: "Node title cannot be empty.",
    });
  } else {
    results.push({
      field: "title",
      status: "success",
      message: "Title configured correctly.",
    });
  }

  // Description validation (with safe optional chaining)
  const descriptionText = node.description?.trim() ?? "";
  if (descriptionText.length === 0) {
    results.push({
      field: "description",
      status: "warning",
      message: "Adding a description helps document your workflow pipeline.",
    });
  } else {
    results.push({
      field: "description",
      status: "success",
      message: "Description provided.",
    });
  }

  return results;
}