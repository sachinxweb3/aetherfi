"use client";

import { NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

import BaseNode from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

export default function ActionNode({
  data,
}: NodeProps<FlowNodeData>) {
  return (
    <BaseNode
      data={data}
      accent="#8B5CF6"
      icon={<Zap size={22} />}
      variant={data.variant}
    />
  );
}