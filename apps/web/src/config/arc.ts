export const ARC_CHAIN_ID = 5_042_002;
export const ARC_CHAIN_ID_HEX = `0x${ARC_CHAIN_ID.toString(16)}`;
export const ARC_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_WS_URL = "wss://rpc.testnet.arc.network";
export const ARC_EXPLORER_URL = "https://testnet.arcscan.app";
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

export const arcTestnet = {
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL], webSocket: [ARC_WS_URL] },
    public: { http: [ARC_RPC_URL], webSocket: [ARC_WS_URL] }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: ARC_EXPLORER_URL
    }
  },
  testnet: true
} as const;

export const ARC_ADD_CHAIN_PARAMS = {
  chainId: ARC_CHAIN_ID_HEX,
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: [ARC_RPC_URL],
  blockExplorerUrls: [ARC_EXPLORER_URL]
};
