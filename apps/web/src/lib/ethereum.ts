import { BrowserProvider, Contract, formatUnits, parseUnits, type Eip1193Provider } from "ethers";
import { ARC_ADD_CHAIN_PARAMS, ARC_CHAIN_ID, ARC_USDC_ADDRESS } from "../config/arc";

export type Address = `0x${string}`;
export type Hash = `0x${string}`;

type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T>;
  on?(eventName: string, listener: (...args: unknown[]) => void): void;
  removeListener?(eventName: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

export const proofraCampaignAbi = ["function contribute(uint256 amount, string receiptURI)"];

export function hasInjectedWallet() {
  return Boolean(window.ethereum);
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found.");
  }

  const accounts = await window.ethereum.request<string[]>({
    method: "eth_requestAccounts"
  });

  if (!accounts[0]) {
    throw new Error("Wallet did not return an account.");
  }

  return accounts[0] as Address;
}

export async function getConnectedChainId() {
  if (!window.ethereum) {
    return undefined;
  }

  const chainId = await window.ethereum.request<string>({
    method: "eth_chainId"
  });

  return Number.parseInt(chainId, 16);
}

export async function switchToArc() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_ADD_CHAIN_PARAMS.chainId }]
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code: number }).code : undefined;

    if (code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_ADD_CHAIN_PARAMS]
    });
  }
}

export async function getUsdcBalance(address: Address) {
  if (!window.ethereum) {
    throw new Error("No injected wallet found.");
  }

  const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
  const usdc = new Contract(ARC_USDC_ADDRESS, erc20Abi, provider);

  const [balance, decimals] = await Promise.all([
    usdc.balanceOf(address) as Promise<bigint>,
    usdc.decimals() as Promise<number>
  ]);

  return {
    raw: balance,
    formatted: formatUnits(balance, decimals),
    decimals
  };
}

export async function supportCampaign(params: {
  account: Address;
  campaignAddress: Address;
  amount: string;
  receiptURI?: string;
}) {
  if (!window.ethereum) {
    throw new Error("No injected wallet found.");
  }

  const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
  const signer = await provider.getSigner(params.account);
  const usdc = new Contract(ARC_USDC_ADDRESS, erc20Abi, signer);
  const campaign = new Contract(params.campaignAddress, proofraCampaignAbi, signer);

  const amount = parseUnits(params.amount, 6);

  const approveTx = await usdc.approve(params.campaignAddress, amount);
  await approveTx.wait();

  const contributeTx = await campaign.contribute(amount, params.receiptURI ?? "");

  return {
    approveHash: approveTx.hash as Hash,
    contributeHash: contributeTx.hash as Hash
  };
}

export function isArcChain(chainId?: number) {
  return chainId === ARC_CHAIN_ID;
}
