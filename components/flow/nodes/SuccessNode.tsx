"use client";

import { Node, NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

import BaseNode from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

export default function SuccessNode({
  data,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <BaseNode
      data={data}
      accent="#10B981"
      icon={<CheckCircle2 size={22} />}
      variant={data.variant}
    />
  );
}