# Proofra Contracts

Solidity contracts for Proofra milestone crowdfunding on Arc.

## Contracts

- `ProofraFactory`: deploys campaign vaults and owns shared registries.
- `ProofraCampaign`: campaign escrow, creator bond, milestone review, payouts, refunds.
- `EvidenceRegistry`: records evidence URI/hash submissions by campaign and milestone.
- `BackerReceipt`: non-transferable receipt minted to first-time campaign backers.
- `MockUSDC`: local 6-decimal USDC test token.

## Arc Defaults

```text
Arc Testnet RPC: https://rpc.testnet.arc.network
Arc Testnet chain id: 5042002
Arc Testnet USDC ERC-20: 0x3600000000000000000000000000000000000000
```

Proofra uses the ERC-20 USDC interface for campaign accounting. Do not mix the ERC-20 6-decimal unit with Arc native gas balance 18-decimal unit.

## Commands

```bash
npm --workspace @proofra/contracts run compile
npm --workspace @proofra/contracts run test
npm --workspace @proofra/contracts run deploy:arc
```

## Deployment Environment

```bash
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
FEE_TREASURY=0x...
ARBITER=0x...
PLATFORM_FEE_BPS=250
```

The deploy script uses the official Arc Testnet USDC address unless `ARC_USDC_ADDRESS` is set.
