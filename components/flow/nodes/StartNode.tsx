"use client";

import { Node, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import BaseNode from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

export default function StartNode({
  data,
}: NodeProps<Node<FlowNodeData>>) {
  return (
    <BaseNode
      data={data}
      accent="#2563EB"
      icon={<Play size={22} />}
      variant={data.variant}
    />
  );
}