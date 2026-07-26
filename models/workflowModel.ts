export type WorkflowExecutionState =
  | "idle"
  | "running"
  | "paused";

export type WorkflowNodeState =
  | "idle"
  | "active"
  | "success"
  | "error";

export type WorkflowNodeModel = {
  id: string;
  title: string;
  description: string;
  state: WorkflowNodeState;

  settings: {
    riskThreshold?: number;
    approvalLimit?: number;
    walletType?: string;
  };
};

export type WorkflowModel = {
  executionState: WorkflowExecutionState;

  nodes: WorkflowNodeModel[];
};