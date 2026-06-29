# Proofra

Proofra is milestone crowdfunding on Arc. Backers fund projects in USDC, funds stay in an onchain escrow, and creators receive payouts only after public milestone evidence is accepted.

**Fund progress, not promises.**

## Why Arc

Proofra is designed for Arc Testnet first:

- Arc is an EVM-compatible L1 for stablecoin-native financial apps.
- USDC is the gas token on Arc, so users reason about fees and campaign balances in dollars.
- Arc Testnet uses chain id `5042002`, RPC `https://rpc.testnet.arc.network`, and explorer `https://testnet.arcscan.app`.
- Proofra uses the Arc USDC ERC-20 interface at `0x3600000000000000000000000000000000000000` for approvals and campaign accounting.

Arc has a dual USDC model: native gas balance uses 18 decimals, while the ERC-20 USDC interface uses 6 decimals. Proofra contracts and UI use the ERC-20 interface for application transfers to avoid mixing raw units.

## Repository

```text
apps/web              React + Vite product interface
packages/contracts   Solidity contracts, Hardhat config, tests, deploy script
docs                  Architecture and Arc integration notes
```

## Product Scope

Proofra MVP includes:

- Arc wallet connection and Arc Testnet network switching.
- USDC balance reads through the Arc ERC-20 interface.
- Campaign discovery and creator campaign draft flow.
- Creator bond, milestone escrow, evidence hashes, voting, arbitration, payouts, and refunds in Solidity.
- Non-transferable backer receipt tokens for contribution history.

Proofra does not launch a token. The first release is USDC-only on Arc Testnet.

## Quick Start

```bash
npm install
npm run build
npm run contracts:test
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run build
```

## Deploy to Arc Testnet

Create `packages/contracts/.env` or use root environment variables:

```bash
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0x...
FEE_TREASURY=0x...
ARBITER=0x...
PLATFORM_FEE_BPS=250
```

Then deploy:

```bash
npm run contracts:deploy:arc
```

Request Arc Testnet USDC from the Circle Faucet before deploying. Never commit private keys or `.env` files.

## Security Notes

This code is an MVP reference implementation. Before handling real funds, Proofra needs an external audit, production monitoring, legal review, and mainnet readiness checks.

Key design boundaries:

- Arbitrators can approve, reject, pause, or resume milestones, but cannot withdraw funds to themselves.
- Creator bond is returned only when a campaign succeeds or when funding fails without creator fault.
- If a milestone is rejected, remaining campaign funds plus forfeited creator bond become refundable to backers.
- Already released milestone payouts cannot be clawed back from the creator wallet.

## Sources

- Arc docs: https://docs.arc.io/
- Arc Network overview: https://docs.arc.io/arc-chain
- Arc integration: https://docs.arc.io/integrate
- Arc build docs: https://docs.arc.io/build
- Arc App Kits: https://docs.arc.io/app-kit
