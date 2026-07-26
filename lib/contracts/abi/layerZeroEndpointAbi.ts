export const layerZeroEndpointAbi = [
  {
    type: "function",
    name: "quote",
    inputs: [
      {
        name: "_params",
        type: "tuple",
        components: [
          { name: "dstEid", type: "uint32" },
          { name: "receiver", type: "bytes32" },
          { name: "message", type: "bytes" },
          { name: "options", type: "bytes" },
          { name: "payInLzToken", type: "bool" },
        ],
      },
      { name: "_sender", type: "address" },
    ],
    outputs: [
      {
        name: "msgFee",
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