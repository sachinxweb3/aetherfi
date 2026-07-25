import { Node } from "@xyflow/react";
import { FlowNodeData } from "../types/FlowNodeData";

export const initialNodes: Node<FlowNodeData>[] = [
  {
    id: "wallet",
    type: "start",
    position: { x: 0, y: 140 },
    data: {
      title: "Connect Wallet",
      subtitle: "Secure Identity",
      variant: "wallet",
      state: "idle",
    },
  },
  {
    id: "review",
    type: "decision",
    position: { x: 300, y: 140 },
    data: {
      title: "Review Transaction",
      subtitle: "Verify Details",
      variant: "review",
      state: "idle",
    },
  },
  {
    id: "risk",
    type: "decision",
    position: { x: 600, y: 140 },
    data: {
      title: "Risk Analysis",
      subtitle: "Confidence Engine",
      variant: "risk",
      state: "idle",
    },
  },
  {
    id: "approval",
    type: "action",
    position: { x: 900, y: 140 },
    data: {
      title: "Approval",
      subtitle: "Ready to Execute",
      variant: "approval",
      state: "idle",
    },
  },
  {
    id: "complete",
    type: "success",
    position: { x: 1200, y: 140 },
    data: {
      title: "Transaction Complete",
      subtitle: "Journey Successful",
      variant: "success",
      state: "idle",
    },
  },
];