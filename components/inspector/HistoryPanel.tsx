"use client";

import { useState } from "react";
import { useHistory } from "@/hooks/useHistory";
import { useWorkflow } from "@/hooks/useWorkflow";

const actionConfig: Record<string, { icon: string; title: string }> = {
  renameNode: {
    icon: "✏️",
    title: "Renamed Node",
  },
  updateDescription: {
    icon: "📝",
    title: "Updated Description",
  },
  updateState: {
    icon: "🟢",
    title: "Changed State",
  },
  updateSettings: {
    icon: "⚙️",
    title: "Updated Settings",
  },
};

function renderPayload(payload: Record<string, unknown>) {
  if ("oldTitle" in payload && "newTitle" in payload) {
    return (
      <>
        <div>{String(payload.oldTitle)}</div>
        <div className="py-1 text-center text-muted-foreground">↓</div>
        <div>{String(payload.newTitle)}</div>
      </>
    );
  }

  if ("oldDescription" in payload && "newDescription" in payload) {
    return (
      <>
        <div className="line-clamp-2">
          {String(payload.oldDescription)}
        </div>
        <div className="py-1 text-center text-muted-foreground">↓</div>
        <div className="line-clamp-2">
          {String(payload.newDescription)}
        </div>
      </>
    );
  }

  if ("oldState" in payload && "newState" in payload) {
    return (
      <>
        <div>{String(payload.oldState)}</div>
        <div className="py-1 text-center text-muted-foreground">↓</div>
        <div>{String(payload.newState)}</div>
      </>
    );
  }

  if ("previous" in payload && "next" in payload) {
    return (
      <div className="text-xs text-muted-foreground">
        Settings updated.
      </div>
    );
  }

  return null;
}

export default function HistoryPanel() {
  const { history, clear } = useHistory();
  const { selectNode } = useWorkflow();

  const [selectedEntry, setSelectedEntry] = useState<null | {
    id: string;
    type: string;
    nodeId: string;
    timestamp: number;
    payload: Record<string, unknown>;
  }>(null);

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-neutral-800">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-medium">History</h3>

        <button
          onClick={clear}
          className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
        >
          Clear
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No changes recorded.
        </p>
      ) : (
        <div className="space-y-5">
          {history.map((entry) => {
            const config = actionConfig[entry.type] || {
              icon: "📌",
              title: entry.type,
            };

            return (
              <div
                key={entry.id}
                className="relative border-l-2 border-violet-400 pl-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">
                    {config.icon} {config.title}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>

                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                    >
                      View
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3 text-sm">
                  {renderPayload(entry.payload)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedEntry(null)}
          />

          <div className="z-10 w-[min(90%,900px)] rounded-xl bg-background p-6 shadow-2xl border">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h4 className="font-medium">History Entry</h4>
              <div className="text-xs text-muted-foreground">
                {new Date(selectedEntry.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="mb-4 text-sm">
              <div className="mb-2">
                <strong>Action:</strong> {selectedEntry.type}
              </div>

              <div className="mb-2">
                <strong>Node ID:</strong> {selectedEntry.nodeId}
              </div>

              <div className="mb-4 rounded-lg bg-muted p-3">
                {renderPayload(selectedEntry.payload)}
              </div>

              <div className="mb-4">
                <pre className="max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(selectedEntry.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => {
                  selectNode(selectedEntry.nodeId);
                  setSelectedEntry(null);
                }}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Jump to Node
              </button>

              <button
                onClick={() => setSelectedEntry(null)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}