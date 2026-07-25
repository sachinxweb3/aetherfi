import { create } from "zustand";

import type {
  WorkflowModel,
  WorkflowNodeSettings,
  WorkflowNodeState,
} from "@/models/workflow";

import { initialWorkflow } from "@/domain/workflow/initialWorkflow";
import { loadWorkflow } from "@/lib/storage/workflowStorage";

import {
  moveNode as moveNodeCommand,
  renameNode as renameNodeCommand,
  updateNodeDescription as updateNodeDescriptionCommand,
  updateNodeSettings as updateNodeSettingsCommand,
  updateNodeState as updateNodeStateCommand,
} from "@/domain/workflow/workflowCommands";

import { useHistoryStore } from "@/stores/historyStore";
import { useUndoRedoStore } from "@/stores/undoRedoStore";
import type { HistoryActionType } from "@/models/history";

interface WorkflowStore {
  workflow: WorkflowModel;
  selectedNodeId: string | null;

  // Execution Engine States
  activeExecutionNodeId: string | null;

  selectNode: (nodeId: string | null) => void;

  renameNode: (nodeId: string, title: string) => void;

  updateNodeState: (nodeId: string, state: WorkflowNodeState) => void;

  updateNodeDescription: (nodeId: string, description: string) => void;

  updateNodeSettings: (
    nodeId: string,
    settings: Partial<WorkflowNodeSettings>,
  ) => void;

  moveNode: (
    nodeId: string,
    position: {
      x: number;
      y: number;
    },
  ) => void;

  // Execution Commands
  runWorkflow: () => Promise<void>;
  resetExecution: () => void;

  undo: () => void;
  redo: () => void;
}

function recordHistory(
  type: HistoryActionType,
  nodeId: string,
  payload: Record<string, unknown>,
) {
  useHistoryStore.getState().record({
    id: crypto.randomUUID(),
    type,
    nodeId,
    timestamp: Date.now(),
    payload,
  });
}

function pushSnapshot(workflow: WorkflowModel) {
  useUndoRedoStore.getState().push(structuredClone(workflow));
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflow: loadWorkflow() ?? initialWorkflow,
  selectedNodeId: null,
  activeExecutionNodeId: null,

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
    }),

  renameNode: (nodeId, title) =>
    set((state) => {
      pushSnapshot(state.workflow);

      const current = state.workflow.nodes.find(
        (node) => node.id === nodeId,
      );

      if (current && current.title !== title) {
        recordHistory("renameNode", nodeId, {
          oldTitle: current.title,
          newTitle: title,
        });
      }

      return {
        workflow: renameNodeCommand(state.workflow, nodeId, title),
      };
    }),

  updateNodeState: (nodeId, workflowState) =>
    set((state) => {
      pushSnapshot(state.workflow);

      const current = state.workflow.nodes.find(
        (node) => node.id === nodeId,
      );

      if (current && current.state !== workflowState) {
        recordHistory("updateState", nodeId, {
          oldState: current.state,
          newState: workflowState,
        });
      }

      return {
        workflow: updateNodeStateCommand(
          state.workflow,
          nodeId,
          workflowState,
        ),
      };
    }),

  updateNodeDescription: (nodeId, description) =>
    set((state) => {
      pushSnapshot(state.workflow);

      const current = state.workflow.nodes.find(
        (node) => node.id === nodeId,
      );

      if (current && current.description !== description) {
        recordHistory("updateDescription", nodeId, {
          oldDescription: current.description,
          newDescription: description,
        });
      }

      return {
        workflow: updateNodeDescriptionCommand(
          state.workflow,
          nodeId,
          description,
        ),
      };
    }),

  updateNodeSettings: (nodeId, settings) =>
    set((state) => {
      pushSnapshot(state.workflow);

      const current = state.workflow.nodes.find(
        (node) => node.id === nodeId,
      );

      if (current) {
        const nextSettings = {
          ...current.settings,
          ...settings,
        };

        if (
          JSON.stringify(current.settings) !==
          JSON.stringify(nextSettings)
        ) {
          recordHistory("updateSettings", nodeId, {
            previous: current.settings,
            next: nextSettings,
          });
        }
      }

      return {
        workflow: updateNodeSettingsCommand(
          state.workflow,
          nodeId,
          settings,
        ),
      };
    }),

  moveNode: (nodeId, position) =>
    set((state) => {
      pushSnapshot(state.workflow);

      return {
        workflow: moveNodeCommand(state.workflow, nodeId, position),
      };
    }),

  resetExecution: () => {
    set((state) => ({
      activeExecutionNodeId: null,
      workflow: {
        ...state.workflow,
        executionState: "idle",
        nodes: state.workflow.nodes.map((node) => ({
          ...node,
          state: "idle",
        })),
      },
    }));
  },

  runWorkflow: async () => {
    const { workflow, resetExecution } = get();

    if (workflow.executionState === "running") {
      return;
    }

    resetExecution();

    set((state) => ({
      workflow: {
        ...state.workflow,
        executionState: "running",
      },
    }));

    const nodes = get().workflow.nodes;

    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];

      // Mark current node active
      set((state) => ({
        activeExecutionNodeId: currentNode.id,
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) =>
            node.id === currentNode.id
              ? { ...node, state: "active" }
              : node,
          ),
        },
      }));

      // Simulate execution delay for Arc network processing
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Mark current node success
      set((state) => ({
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) =>
            node.id === currentNode.id
              ? { ...node, state: "success" }
              : node,
          ),
        },
      }));
    }

    // Finish execution
    set((state) => ({
      activeExecutionNodeId: null,
      workflow: {
        ...state.workflow,
        executionState: "idle",
      },
    }));
  },

  undo: () => {
    const current = get().workflow;

    const previous = useUndoRedoStore.getState().undo();

    if (!previous) {
      return;
    }

    useUndoRedoStore.setState((state) => ({
      redoStack: [...state.redoStack, structuredClone(current)],
    }));

    set({
      workflow: structuredClone(previous),
    });
  },

  redo: () => {
    const current = get().workflow;

    const next = useUndoRedoStore.getState().redo();

    if (!next) {
      return;
    }

    useUndoRedoStore.setState((state) => ({
      undoStack: [...state.undoStack, structuredClone(current)],
    }));

    set({
      workflow: structuredClone(next),
    });
  },
}));