import type { Node } from "@xyflow/react";

import type { FlowNodeData } from "../types/FlowNodeData";

export interface NodePresentation {
  type: Node<FlowNodeData>["type"];
  variant: FlowNodeData["variant"];
  subtitle: string;
}

export const presentationRegistry: Record<
  string,
  NodePresentation
> = {
  wallet: {
    type: "start",
    variant: "wallet",
    subtitle: "Secure Identity",
  },

  review: {
    type: "decision",
    variant: "review",
    subtitle: "Verify Details",
  },

  risk: {
    type: "decision",
    variant: "risk",
    subtitle: "Confidence Engine",
  },

  approval: {
    type: "action",
    variant: "approval",
    subtitle: "Ready to Execute",
  },

  complete: {
    type: "success",
    variant: "success",
    subtitle: "Journey Successful",
  },
};