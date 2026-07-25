"use client";

import { NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

import BaseNode, { NodeVariant } from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

interface ExtendedFlowNodeData extends FlowNodeData {
  variant?: NodeVariant;
}

export default function SuccessNode({
  data,
}: NodeProps<ExtendedFlowNodeData>) {
  return (
    <BaseNode
      data={data}
      accent="#10B981"
      icon={<CheckCircle2 size={22} />}
      variant={data.variant}
    />
  );
}