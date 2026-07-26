import type { WorkflowModel } from "@/models/workflow";

export const initialWorkflow: WorkflowModel = {
  id: "wf-aether-01",
  title: "Aether Automation Flow",
  executionState: "idle",
  nodes: [
    {
      id: "wallet",
      title: "Connect Wallet",
      description: "Secure Identity",
      state: "idle",
      settings: { walletType: "MetaMask" },
    },
    {
      id: "review",
      title: "Review Transaction",
      description: "Verify Details",
      state: "idle",
      settings: { requireConfirmation: true },
    },
    {
      id: "risk",
      title: "Risk Analysis",
      description: "Confidence Engine",
      state: "idle",
      settings: { autoRetry: false },
    },
    {
      id: "approval",
      title: "Approval",
      description: "Ready to Execute",
      state: "idle",
      settings: { requireConfirmation: true },
    },
    {
      id: "success",
      title: "Transaction Complete",
      description: "Journey Successful",
      state: "idle",
      settings: { timeoutMs: 5000 },
    },
  ],
  layout: {
    nodes: [
      { id: "wallet", position: { x: 0, y: 0 } },
      { id: "review", position: { x: 320, y: 0 } },
      { id: "risk", position: { x: 640, y: 0 } },
      { id: "approval", position: { x: 960, y: 0 } },
      { id: "success", position: { x: 1280, y: 0 } },
    ],
  },
};