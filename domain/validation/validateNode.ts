import type { WorkflowNodeModel } from "@/models/workflow";

export type ValidationStatus =
  | "success"
  | "warning"
  | "error";

export interface ValidationResult {
  field: string;
  status: ValidationStatus;
  message: string;
}

export function validateNode(
  node: WorkflowNodeModel,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Name
  if (node.title.trim().length === 0) {
    results.push({
      field: "title",
      status: "error",
      message: "Node name is required.",
    });
  } else {
    results.push({
      field: "title",
      status: "success",
      message: "Name looks good.",
    });
  }

  // Description
  if (node.description.trim().length === 0) {
    results.push({
      field: "description",
      status: "warning",
      message: "Description is recommended.",
    });
  } else {
    results.push({
      field: "description",
      status: "success",
      message: "Description added.",
    });
  }

  // Wallet
  if (!node.settings.walletType?.trim()) {
    results.push({
      field: "walletType",
      status: "warning",
      message: "Wallet type not configured.",
    });
  } else {
    results.push({
      field: "walletType",
      status: "success",
      message: "Wallet configured.",
    });
  }

  // Risk
  const risk = node.settings.riskThreshold;

  if (risk === undefined) {
    results.push({
      field: "riskThreshold",
      status: "warning",
      message: "Risk threshold not set.",
    });
  } else if (risk < 0 || risk > 100) {
    results.push({
      field: "riskThreshold",
      status: "error",
      message: "Risk threshold must be between 0 and 100.",
    });
  } else {
    results.push({
      field: "riskThreshold",
      status: "success",
      message: "Risk threshold valid.",
    });
  }

  // Approval
  const approval = node.settings.approvalLimit;

  if (approval === undefined) {
    results.push({
      field: "approvalLimit",
      status: "warning",
      message: "Approval limit not configured.",
    });
  } else if (approval < 0) {
    results.push({
      field: "approvalLimit",
      status: "error",
      message: "Approval limit cannot be negative.",
    });
  } else {
    results.push({
      field: "approvalLimit",
      status: "success",
      message: "Approval limit valid.",
    });
  }

  return results;
}