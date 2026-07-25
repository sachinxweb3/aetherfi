import { Edge } from "@xyflow/react";

export const initialEdges: Edge[] = [
  {
    id: "wallet-review",
    source: "wallet",
    target: "review",
    type: "workflow",
    data: {
      state: "idle",
    },
  },
  {
    id: "review-risk",
    source: "review",
    target: "risk",
    type: "workflow",
    data: {
      state: "idle",
    },
  },
  {
    id: "risk-approval",
    source: "risk",
    target: "approval",
    type: "workflow",
    data: {
      state: "idle",
    },
  },
  {
    id: "approval-complete",
    source: "approval",
    target: "complete",
    type: "workflow",
    data: {
      state: "idle",
    },
  },
];