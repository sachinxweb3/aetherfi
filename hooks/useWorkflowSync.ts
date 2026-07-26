import { useMemo } from "react";

import { useCanvasAdapter } from "@/hooks/useCanvasAdapter";
import type { WorkflowModel } from "@/models/workflow";

export function useWorkflowSync(
  workflow: WorkflowModel,
) {
  const nodes = useCanvasAdapter(workflow);

  return useMemo(
    () => ({
      nodes,
    }),
    [nodes],
  );
}