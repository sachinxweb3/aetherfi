import { useState } from "react";

import type {
  WorkflowModel,
} from "@/models/workflowModel";

export function useWorkflowModel() {
  return useState<WorkflowModel>({
    executionState: "idle",

    nodes: [],
  });
}