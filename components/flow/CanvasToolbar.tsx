"use client";

import { useState } from "react";
import { Loader2, Play, Save, Upload, Zap, CheckCircle2 } from "lucide-react";

import { useWorkflow } from "@/hooks/useWorkflow";
import { useUndoRedoStore } from "@/stores/undoRedoStore";

export default function CanvasToolbar() {
  const {
    workflow,
    undo,
    redo,
    save,
    exportJson,
    runWorkflow,
    resetExecution,
  } = useWorkflow();

  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [saved, setSaved] = useState(false);

  const undoCount = useUndoRedoStore(
    (state) => state.undoStack.length,
  );

  const redoCount = useUndoRedoStore(
    (state) => state.redoStack.length,
  );

  const isRunning = workflow.executionState === "running";

  function handleSave() {
    const success = save();

    if (!success) {
      return;
    }

    setSaved(true);

    setLastSaved(new Date().toLocaleTimeString());

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/80 p-3 shadow-sm backdrop-blur dark:bg-neutral-900/80">
      <button
        onClick={runWorkflow}
        disabled={isRunning}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
      >
        {isRunning ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Running...</>
        ) : (
          <><Play className="h-4 w-4" aria-hidden="true" /> Run Workflow</>
        )}
      </button>

      <button
        onClick={resetExecution}
        disabled={isRunning}
        className="rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        ↺ Reset
      </button>

      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

      <button
        onClick={undo}
        disabled={undoCount === 0 || isRunning}
        className="rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        ↶ Undo
      </button>

      <button
        onClick={redo}
        disabled={redoCount === 0 || isRunning}
        className="rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        ↷ Redo
      </button>

      <button
        onClick={handleSave}
        className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        <Save className="h-4 w-4" aria-hidden="true" /> Save
      </button>

      <button
        onClick={exportJson}
        className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition hover:bg-slate-100 dark:hover:bg-neutral-800"
      >
        <Upload className="h-4 w-4" aria-hidden="true" /> Export
      </button>

      <div className="ml-auto flex flex-col text-right text-xs">
        <span
          className={
            isRunning
              ? "inline-flex items-center justify-end gap-1 font-semibold text-blue-600 animate-pulse"
              : saved
                ? "inline-flex items-center justify-end gap-1 font-medium text-green-600"
                : "text-neutral-500"
          }
        >
          {isRunning ? (
            <><Zap className="h-3.5 w-3.5" aria-hidden="true" /> Executing Arc Flow</>
          ) : saved ? (
            <><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Workflow Saved</>
          ) : (
            "Ready"
          )}
        </span>

        {lastSaved && (
          <span className="text-neutral-500">
            Last Saved: {lastSaved}
          </span>
        )}
      </div>
    </div>
  );
}