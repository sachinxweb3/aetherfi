"use client";

import { useWorkflow } from "@/hooks/useWorkflow";

import EmptyInspector from "./EmptyInspector";
import NodeInspector from "./NodeInspector";

export default function InspectorPanel() {
  const { selectedNode } = useWorkflow();

  return (
    <aside className="w-[340px] rounded-3xl border bg-background p-6">
      {selectedNode ? (
        <NodeInspector />
      ) : (
        <EmptyInspector />
      )}
    </aside>
  );
}