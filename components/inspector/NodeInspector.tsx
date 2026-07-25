"use client";

import { useEffect, useState } from "react";

import { useWorkflow } from "@/hooks/useWorkflow";
import type { WorkflowNodeState } from "@/models/workflow";
import HistoryPanel from "./HistoryPanel";
import ValidationPanel from "./ValidationPanel";

export default function NodeInspector() {
  const {
    selectedNode,
    renameNode,
    updateNodeDescription,
    updateNodeState,
    updateNodeSettings,
  } = useWorkflow();

  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle(selectedNode?.title ?? "");
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  function commitTitle() {
    const nextTitle = title.trim();

    if (
      nextTitle.length === 0 ||
      nextTitle === selectedNode.title
    ) {
      setTitle(selectedNode.title);
      return;
    }

    renameNode(selectedNode.id, nextTitle);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Selected Node
        </p>

        <input
          className="mt-2 w-full rounded-xl border px-3 py-2"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Description
        </p>

        <textarea
          rows={4}
          className="mt-2 w-full rounded-xl border px-3 py-2"
          value={selectedNode.description}
          onChange={(e) =>
            updateNodeDescription(
              selectedNode.id,
              e.target.value,
            )
          }
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Status
        </p>

        <select
          className="mt-2 w-full rounded-xl border px-3 py-2"
          value={selectedNode.state}
          onChange={(e) =>
            updateNodeState(
              selectedNode.id,
              e.target.value as WorkflowNodeState,
            )
          }
        >
          <option value="idle">Idle</option>
          <option value="active">Active</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="space-y-4 rounded-xl border p-4">
        <h3 className="font-medium">
          Wallet Settings
        </h3>

        <input
          placeholder="Wallet Type"
          className="w-full rounded-xl border px-3 py-2"
          value={
            selectedNode.settings.walletType ??
            ""
          }
          onChange={(e) =>
            updateNodeSettings(
              selectedNode.id,
              {
                walletType:
                  e.target.value,
              },
            )
          }
        />

        <input
          type="number"
          placeholder="Approval Limit"
          className="w-full rounded-xl border px-3 py-2"
          value={
            selectedNode.settings
              .approvalLimit ?? ""
          }
          onChange={(e) =>
            updateNodeSettings(
              selectedNode.id,
              {
                approvalLimit:
                  e.target.value === ""
                    ? undefined
                    : Number(
                        e.target.value,
                      ),
              },
            )
          }
        />

        <input
          type="number"
          placeholder="Risk Threshold"
          className="w-full rounded-xl border px-3 py-2"
          value={
            selectedNode.settings
              .riskThreshold ?? ""
          }
          onChange={(e) =>
            updateNodeSettings(
              selectedNode.id,
              {
                riskThreshold:
                  e.target.value === ""
                    ? undefined
                    : Number(
                        e.target.value,
                      ),
              },
            )
          }
        />
      </div>

      <ValidationPanel />
      <HistoryPanel />
    </div>
  );
}