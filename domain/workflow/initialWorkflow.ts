import type { WorkflowModel } from "@/models/workflow";

export const initialWorkflow: WorkflowModel = {
  executionState: "idle",

  nodes: [
    {
      id: "wallet",
      title: "Connect Wallet",
      description: "Connect the user's wallet.",
      state: "idle",
      settings: {
        walletType: "MetaMask",
      },
    },
    {
      id: "review",
      title: "Review Transaction",
      description: "Review payment details.",
      state: "idle",
      settings: {
        approvalLimit: 1000,
      },
    },
    {
      id: "risk",
      title: "Risk Analysis",
      description: "Analyse transaction risk.",
      state: "idle",
      settings: {
        riskThreshold: 80,
      },
    },
    {
      id: "approval",
      title: "Approval",
      description: "Final approval step.",
      state: "idle",
      settings: {},
    },
    {
      id: "complete",
      title: "Transaction Complete",
      description: "Journey Successful.",
      state: "idle",
      settings: {},
    },
  ],

  layout: {
    nodes: [
      { id: "wallet", position: { x: 0, y: 140 } },
      { id: "review", position: { x: 300, y: 140 } },
      { id: "risk", position: { x: 600, y: 140 } },
      { id: "approval", position: { x: 900, y: 140 } },
      { id: "complete", position: { x: 1200, y: 140 } },
    ],
  },
};