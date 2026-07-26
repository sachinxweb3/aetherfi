export const arcGasEngineAbi = [
  {
    type: "function",
    name: "getGasFeeInUSDC",
    inputs: [{ name: "gasAmount", type: "uint256" }],
    outputs: [{ name: "usdcAmount", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLayerZeroFee",
    inputs: [
      { name: "dstEid", type: "uint32" },
      { name: "payload", type: "bytes" },
      { name: "options", type: "bytes" },
    ],
    outputs: [
      {
        name: "fee",
        type: "tuple",
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const