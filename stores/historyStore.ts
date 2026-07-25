import { create } from "zustand";

import type { HistoryEntry } from "@/models/history";

interface HistoryStore {
  history: HistoryEntry[];

  record: (entry: HistoryEntry) => void;

  clear: () => void;
}

export const useHistoryStore =
  create<HistoryStore>((set) => ({
    history: [],

    record: (entry) =>
      set((state) => ({
        history: [...state.history, entry],
      })),

    clear: () =>
      set({
        history: [],
      }),
  }));