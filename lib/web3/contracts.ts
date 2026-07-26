// Arc Testnet Smart Contract Router
export const ARC_CONTRACT_ADDRESSES = {
  usdcNative: "0x0000000000000000000000000000000000000000",
  aetherRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  zkVaultShield: "0x3e1F27E9500A45e6914fA2D8133502845A2594a1",
};

export async function executeArcOnChainTx(
  fromAddress: string,
  toAddress: string,
  amountInUSDC: string
) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Web3 provider not detected.");
  }

  try {
    // Convert USDC amount to Wei (18 decimals)
    const weiAmount = "0x" + (BigInt(Math.floor(parseFloat(amountInUSDC) * 1e6)) * BigInt(1e12)).toString(16);

    const txParameters = {
      from: fromAddress,
      to: toAddress || ARC_CONTRACT_ADDRESSES.aetherRouter,
      value: "0x0", // Native gas is USDC on Arc Chain
      data: "0x", // Direct contract payload interaction
    };

    // Prompt user's wallet (Rabby / MetaMask / Zerion) for transaction signing
    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [txParameters],
    })) as string;

    return {
      success: true,
      hash: txHash,
      explorerUrl: `https://explorer.testnet.arc.network/tx/${txHash}`,
    };
  } catch (error: any) {
    throw new Error(error?.message || "User rejected transaction signing.");
  }
}