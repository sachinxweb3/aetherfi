import { useState } from "react";

export type ExecutionState =
  | "idle"
  | "running"
  | "paused";

export type InteractionState = {
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  executionState: ExecutionState;
};

export function useInteractionState() {
  return useState<InteractionState>({
    hoveredNodeId: null,
    selectedNodeId: null,
    focusedNodeId: null,
    executionState: "idle",
  });
}