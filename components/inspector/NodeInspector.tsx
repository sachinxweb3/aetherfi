"use client";

import { useEffect, useState } from "react";

import { useWorkflow } from "@/hooks/useWorkflow";
import type { WorkflowNodeState } from "@/models/workflow";

export default function NodeInspector() {
  const {
    selectedNode,
    renameNode,
    updateNodeDescription,
    updateNodeState,
    updateNodeSettings,
  } = useWorkflow();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title);
      setDescription(selectedNode.description ?? "");
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  function handleTitleBlur() {
    if (!selectedNode) return;

    const nextTitle = title.trim();

    if (nextTitle.length === 0 || nextTitle === selectedNode.title) {
      setTitle(selectedNode.title);
      return;
    }

    renameNode(selectedNode.id, nextTitle);
  }

  function handleDescriptionBlur() {
    if (!selectedNode) return;

    const nextDesc = description.trim();

    if (nextDesc === (selectedNode.description ?? "")) {
      return;
    }

    updateNodeDescription(selectedNode.id, nextDesc);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Node Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none transition focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Execution Status
        </label>
        <select
          value={selectedNode.state}
          onChange={(e) =>
            updateNodeState(
              selectedNode.id,
              e.target.value as WorkflowNodeState,
            )
          }
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none transition focus:border-primary"
        >
          <option value="idle">Idle</option>
          <option value="active">Active</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Require Confirmation
          </span>
          <input
            type="checkbox"
            checked={Boolean(selectedNode.settings?.requireConfirmation)}
            onChange={(e) =>
              updateNodeSettings(selectedNode.id, {
                requireConfirmation: e.target.checked,
              })
            }
            className="h-4 w-4 rounded accent-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Auto Retry on Failure
          </span>
          <input
            type="checkbox"
            checked={Boolean(selectedNode.settings?.autoRetry)}
            onChange={(e) =>
              updateNodeSettings(selectedNode.id, {
                autoRetry: e.target.checked,
              })
            }
            className="h-4 w-4 rounded accent-primary"
          />
        </div>
      </div>
    </div>
  );
}