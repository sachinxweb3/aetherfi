export type WorkflowExecutionState =
  | "idle"
  | "running"
  | "paused";

export type WorkflowNodeState =
  | "idle"
  | "active"
  | "success"
  | "error";

export interface WorkflowNodeSettings {
  riskThreshold?: number;
  approvalLimit?: number;
  walletType?: string;
}

export interface WorkflowNodeModel {
  id: string;
  title: string;
  description: string;
  state: WorkflowNodeState;

  settings: WorkflowNodeSettings;
}

export interface WorkflowNodeLayout {
  id: string;

  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowLayoutModel {
  nodes: WorkflowNodeLayout[];
}

export interface WorkflowModel {
  executionState: WorkflowExecutionState;

  nodes: WorkflowNodeModel[];

  layout: WorkflowLayoutModel;
}