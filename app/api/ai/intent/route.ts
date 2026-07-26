import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const lowerPrompt = prompt.toLowerCase();
    let actionType = "SWAP";
    let estimatedGas = "0.0001 USDC";
    let targetContract = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    let parsedAmount = "500";

    // Extract amount if present in text
    const amountMatch = prompt.match(/\d+/);
    if (amountMatch) {
      parsedAmount = amountMatch[0];
    }

    if (lowerPrompt.includes("stake") || lowerPrompt.includes("yield") || lowerPrompt.includes("vault")) {
      actionType = "STAKE_YIELD";
      targetContract = "0x3e1F27E9500A45e6914fA2D8133502845A2594a1";
    } else if (lowerPrompt.includes("shield") || lowerPrompt.includes("private") || lowerPrompt.includes("stealth")) {
      actionType = "ZK_SHIELD_TRANSFER";
      targetContract = "0x3e1F27E9500A45e6914fA2D8133502845A2594a1";
    }

    return NextResponse.json({
      success: true,
      synthesizedIntent: {
        actionType,
        parsedAmount,
        targetContract,
        gasEstimate: estimatedGas,
        route: `Arc Core Swarm Node #04 ➔ ${actionType} ➔ Settlement Layer`,
        netMetric: actionType === "STAKE_YIELD" ? "18.4% APY" : "0.00% Slippage",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to parse intent." }, { status: 500 });
  }
}