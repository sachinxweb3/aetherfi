import type { WorkflowModel } from "@/models/workflow";

export const STORAGE_KEY = "aether-workflow";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveWorkflow(
  workflow: WorkflowModel,
): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(workflow),
    );

    return true;
  } catch (error) {
    console.error("Failed to save workflow", error);

    return false;
  }
}

export function loadWorkflow():
  | WorkflowModel
  | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as WorkflowModel;
  } catch (error) {
    console.error("Failed to load workflow", error);

    return null;
  }
}

export function clearWorkflow() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportWorkflow(
  workflow: WorkflowModel,
) {
  if (!isBrowser()) {
    return;
  }

  const blob = new Blob(
    [JSON.stringify(workflow, null, 2)],
    {
      type: "application/json",
    },
  );

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "workflow.json";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}