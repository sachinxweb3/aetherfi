import { useMemo } from "react";

import { useWorkflowStore } from "@/stores/workflowStore";
import {
  saveWorkflow,
  exportWorkflow,
} from "@/lib/storage/workflowStorage";

export function useWorkflow() {
  const workflow = useWorkflowStore((state) => state.workflow);

  const selectedNodeId = useWorkflowStore(
    (state) => state.selectedNodeId,
  );

  const activeExecutionNodeId = useWorkflowStore(
    (state) => state.activeExecutionNodeId,
  );

  const selectNode = useWorkflowStore(
    (state) => state.selectNode,
  );

  const renameNode = useWorkflowStore(
    (state) => state.renameNode,
  );

  const updateNodeDescription = useWorkflowStore(
    (state) => state.updateNodeDescription,
  );

  const updateNodeState = useWorkflowStore(
    (state) => state.updateNodeState,
  );

  const updateNodeSettings = useWorkflowStore(
    (state) => state.updateNodeSettings,
  );

  const moveNode = useWorkflowStore(
    (state) => state.moveNode,
  );

  const runWorkflow = useWorkflowStore(
    (state) => state.runWorkflow,
  );

  const resetExecution = useWorkflowStore(
    (state) => state.resetExecution,
  );

  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) {
      return undefined;
    }

    return workflow.nodes.find(
      (node) => node.id === selectedNodeId,
    );
  }, [workflow.nodes, selectedNodeId]);

  const save = () => {
    return saveWorkflow(workflow);
  };
  const exportJson = () => exportWorkflow(workflow);

  return {
    workflow,

    selectedNode,
    selectedNodeId,
    activeExecutionNodeId,

    selectNode,

    renameNode,
    updateNodeDescription,
    updateNodeState,
    updateNodeSettings,
    moveNode,

    runWorkflow,
    resetExecution,

    undo,
    redo,

    save,
    exportJson,
  };
}