"use client";

import { NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import BaseNode, { NodeVariant } from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

interface ExtendedFlowNodeData extends FlowNodeData {
  variant?: NodeVariant;
}

export default function StartNode({
  data,
}: NodeProps<ExtendedFlowNodeData>) {
  return (
    <BaseNode
      data={data}
      accent="#2563EB"
      icon={<Play size={22} />}
      variant={data.variant}
    />
  );
}