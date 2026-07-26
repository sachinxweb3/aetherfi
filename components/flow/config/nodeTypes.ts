import { NodeTypes } from "@xyflow/react";

import StartNode from "../nodes/StartNode";
import DecisionNode from "../nodes/DecisionNode";
import ActionNode from "../nodes/ActionNode";
import SuccessNode from "../nodes/SuccessNode";

export const nodeTypes: NodeTypes = {
  start: StartNode,
  decision: DecisionNode,
  action: ActionNode,
  success: SuccessNode,
};