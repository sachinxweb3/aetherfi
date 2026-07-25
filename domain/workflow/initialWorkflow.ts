import type { WorkflowModel } from "@/models/workflow";

export const initialWorkflow: WorkflowModel = {
  id: "wf-aether-01",
  title: "Aether Automation Flow",
  executionState: "idle",
  nodes: [
    {
      id: "wallet",
      title: "Wallet Connected",
      description: "Source wallet authenticated and ready for transaction execution.",
      state: "idle",
      settings: {
        walletType: "MetaMask / Web3",
      },
    },
    {
      id: "review",
      title: "Simulation Review",
      description: "Simulating on-chain state changes and pre-validation checks.",
      state: "idle",
      settings: {
        requireConfirmation: true,
      },
    },
    {
      id: "risk",
      title: "AI Risk Analysis",
      description: "Evaluating transaction safety, gas spikes, and contract risks.",
      state: "idle",
      settings: {
        autoRetry: false,
      },
    },
    {
      id: "approval",
      title: "User Authorization",
      description: "Waiting for user cryptographic signature authorization.",
      state: "idle",
      settings: {
        requireConfirmation: true,
      },
    },
    {
      id: "success",
      title: "Execution Finalized",
      description: "Transaction submitted and confirmed on Arc network.",
      state: "idle",
      settings: {
        timeoutMs: 5000,
      },
    },
  ],
  layout: {
    nodes: [
      { id: "wallet", position: { x: 250, y: 0 } },
      { id: "review", position: { x: 250, y: 150 } },
      { id: "risk", position: { x: 250, y: 300 } },
      { id: "approval", position: { x: 250, y: 450 } },
      { id: "success", position: { x: 250, y: 600 } },
    ],
  },
};