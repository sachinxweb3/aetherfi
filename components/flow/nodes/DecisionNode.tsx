"use client";

import { NodeProps } from "@xyflow/react";
import { ShieldCheck } from "lucide-react";

import BaseNode from "../BaseNode";
import { FlowNodeData } from "../types/FlowNodeData";

export default function DecisionNode({
  data,
}: NodeProps<FlowNodeData>) {
  return (
    <BaseNode
      data={data}
      accent="#F59E0B"
      icon={<ShieldCheck size={22} />}
      variant={data.variant}
    />
  );
}