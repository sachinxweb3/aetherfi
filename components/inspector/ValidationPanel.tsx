"use client";

import { useValidation } from "@/hooks/useValidation";

const statusStyles = {
  success:
    "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
  warning:
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  error:
    "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusIcons = {
  success: "🟢",
  warning: "🟡",
  error: "🔴",
};

export default function ValidationPanel() {
  const { results } = useValidation();

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-neutral-800">
      <h3 className="font-medium">
        Validation
      </h3>

      {results.map((result) => (
        <div
          key={result.field}
          className={`rounded-lg border px-3 py-2 text-sm ${statusStyles[result.status]}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {result.field}
            </span>

            <span>
              {statusIcons[result.status]}
            </span>
          </div>

          <p className="mt-1 text-xs opacity-80">
            {result.message}
          </p>
        </div>
      ))}
    </div>
  );
}