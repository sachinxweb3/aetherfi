import { useMemo } from "react";

import { validateNode } from "@/domain/validation/validateNode";
import { useWorkflow } from "@/hooks/useWorkflow";

export function useValidation() {
  const { selectedNode } = useWorkflow();

  const results = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    return validateNode(selectedNode);
  }, [selectedNode]);

  const errors = results.filter(
    (result) => result.status === "error",
  );

  const warnings = results.filter(
    (result) => result.status === "warning",
  );

  const success = results.filter(
    (result) => result.status === "success",
  );

  return {
    results,
    errors,
    warnings,
    success,
    isValid: errors.length === 0,
  };
}