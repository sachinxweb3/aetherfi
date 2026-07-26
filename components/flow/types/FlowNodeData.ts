import type { NodeVariant } from "../BaseNode";

export interface FlowNodeData extends Record<string, unknown> {
  title: string;
  subtitle: string;
  variant: NodeVariant;
  state?: string;
  selected?: boolean;
}