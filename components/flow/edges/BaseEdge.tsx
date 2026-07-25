"use client";

import {
  BaseEdge as ReactFlowBaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from "@xyflow/react";

type WorkflowEdgeState =
  | "idle"
  | "active"
  | "success"
  | "warning"
  | "error";

const edgeStyles: Record<
  WorkflowEdgeState,
  {
    stroke: string;
    strokeWidth: number;
  }
> = {
  idle: {
    stroke: "#CBD5E1",
    strokeWidth: 2.5,
  },
  active: {
    stroke: "#2563EB",
    strokeWidth: 3,
  },
  success: {
    stroke: "#10B981",
    strokeWidth: 3,
  },
  warning: {
    stroke: "#F59E0B",
    strokeWidth: 3,
  },
  error: {
    stroke: "#EF4444",
    strokeWidth: 3,
  },
};

export default function BaseEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const state =
    (data?.state as WorkflowEdgeState | undefined) ?? "idle";

  const style = edgeStyles[state];

  return (
    <>
      <ReactFlowBaseEdge
        id={id}
        path={path}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          transition:
            "stroke 340ms cubic-bezier(0.16, 1, 0.3, 1), stroke-width 340ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      <EdgeLabelRenderer />
    </>
  );
}