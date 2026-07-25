import { useMemo } from "react";

import { useHistoryStore } from "@/stores/historyStore";

export function useHistory() {
  const history = useHistoryStore(
    (state) => state.history,
  );

  const clear = useHistoryStore(
    (state) => state.clear,
  );

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => b.timestamp - a.timestamp,
      ),
    [history],
  );

  return {
    history: sortedHistory,
    clear,
  };
}