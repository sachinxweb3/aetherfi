export type HistoryActionType =
  | "renameNode"
  | "updateDescription"
  | "updateState"
  | "updateSettings";

export interface HistoryEntry {
  id: string;

  type: HistoryActionType;

  nodeId: string;

  timestamp: number;

  payload: Record<string, unknown>;
}