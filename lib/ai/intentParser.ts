export type FinancialActionType = "SWAP" | "BRIDGE" | "YIELD" | "STAKE"

export interface ParsedIntent {
  rawPrompt: string
  action: FinancialActionType
  sourceToken: string
  targetToken: string
  amount: string
  slippageTolerancePercent: number
  targetChainId: number
  confidenceScore: number
}

/**
 * Deterministically parses natural language financial prompts into structured execution payloads.
 */
export function parseFinancialIntent(
  inputPrompt: string,
  currentChainId: number = 5040
): ParsedIntent {
  const normalized = inputPrompt.toLowerCase().trim()

  let action: FinancialActionType = "SWAP"
  if (normalized.includes("bridge") || normalized.includes("transfer across")) {
    action = "BRIDGE"
  } else if (normalized.includes("yield") || normalized.includes("vault") || normalized.includes("deposit")) {
    action = "YIELD"
  } else if (normalized.includes("stake")) {
    action = "STAKE"
  }

  // Extract numerical amount using regex match
  const amountMatch = normalized.match(/(\d+(\.\d+)?)/)
  const amount = amountMatch ? amountMatch[1] : "100"

  // Token identification logic
  let sourceToken = "USDC"
  let targetToken = "ETH"

  if (normalized.includes("eth to usdc") || normalized.includes("ethereum to usdc")) {
    sourceToken = "ETH"
    targetToken = "USDC"
  } else if (normalized.includes("usdc to eth") || normalized.includes("usdc to ethereum")) {
    sourceToken = "USDC"
    targetToken = "ETH"
  } else if (normalized.includes("weth")) {
    targetToken = "WETH"
  } else if (normalized.includes("arb")) {
    targetToken = "ARB"
  }

  // Chain identification logic
  let targetChainId = currentChainId
  if (normalized.includes("arbitrum")) {
    targetChainId = 42161
  } else if (normalized.includes("ethereum") || normalized.includes("mainnet")) {
    targetChainId = 1
  } else if (normalized.includes("sepolia")) {
    targetChainId = 11155111
  } else if (normalized.includes("arc")) {
    targetChainId = 5040
  }

  // Slippage extraction logic
  const slippageMatch = normalized.match(/(\d+(\.\d+)?)%\s*slippage/)
  const slippageTolerancePercent = slippageMatch ? parseFloat(slippageMatch[1]) : 0.5

  return {
    rawPrompt: inputPrompt,
    action,
    sourceToken,
    targetToken,
    amount,
    slippageTolerancePercent,
    targetChainId,
    confidenceScore: 0.98,
  }
}