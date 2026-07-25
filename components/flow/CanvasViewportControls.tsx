"use client";

import { useReactFlow } from "@xyflow/react";

export default function CanvasViewportControls() {
  const reactFlow = useReactFlow();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => reactFlow.zoomIn()}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        🔍 +
      </button>

      <button
        onClick={() => reactFlow.zoomOut()}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        🔎 −
      </button>

      <button
        onClick={() => reactFlow.fitView()}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        🎯 Fit
      </button>
    </div>
  );
}npm 