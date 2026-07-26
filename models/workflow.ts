export type WorkflowNodeState =
  | "idle"
  | "active"
  | "success"
  | "warning"
  | "error";

export interface WorkflowNodeSettings {
  requireConfirmation?: boolean;
  autoRetry?: boolean;
  timeoutMs?: number;
  [key: string]: unknown;
}

export interface WorkflowNodeModel {
  id: string;
  title: string;
  description?: string;
  state: WorkflowNodeState;
  settings?: WorkflowNodeSettings;
}

export interface WorkflowLayoutNode {
  id: string;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

export interface WorkflowLayout {
  nodes: WorkflowLayoutNode[];
  [key: string]: unknown;
}

export interface WorkflowModel {
  id: string;
  title: string;
  executionState: "idle" | "running" | "paused" | "error";
  nodes: WorkflowNodeModel[];
  layout?: WorkflowLayout;
  [key: string]: unknown;
}