import { create } from "zustand";

import type { WorkflowModel } from "@/models/workflow";

interface UndoRedoStore {
  undoStack: WorkflowModel[];
  redoStack: WorkflowModel[];

  push: (workflow: WorkflowModel) => void;
  undo: () => WorkflowModel | null;
  redo: () => WorkflowModel | null;
  clear: () => void;
}

export const useUndoRedoStore =
  create<UndoRedoStore>((set, get) => ({
    undoStack: [],
    redoStack: [],

    push: (workflow) =>
      set((state) => ({
        undoStack: [
          ...state.undoStack,
          structuredClone(workflow),
        ],
        redoStack: [],
      })),

    undo: () => {
      const { undoStack, redoStack } = get();

      if (undoStack.length === 0) {
        return null;
      }

      const previous =
        undoStack[undoStack.length - 1];

      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [
          ...redoStack,
          structuredClone(previous),
        ],
      });

      return previous;
    },

    redo: () => {
      const { redoStack, undoStack } = get();

      if (redoStack.length === 0) {
        return null;
      }

      const next =
        redoStack[redoStack.length - 1];

      set({
        redoStack: redoStack.slice(0, -1),
        undoStack: [
          ...undoStack,
          structuredClone(next),
        ],
      });

      return next;
    },

    clear: () =>
      set({
        undoStack: [],
        redoStack: [],
      }),
  }));