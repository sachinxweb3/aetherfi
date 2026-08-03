"use client";

import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

export default function CanvasViewportControls() {
  const reactFlow = useReactFlow();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => reactFlow.zoomIn()}
        aria-label="Zoom in"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        onClick={() => reactFlow.zoomOut()}
        aria-label="Zoom out"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        onClick={() => reactFlow.fitView()}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        <Maximize className="h-4 w-4" aria-hidden="true" /> Fit
      </button>
    </div>
  );
}