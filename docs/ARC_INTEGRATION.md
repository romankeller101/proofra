# Arc Integration Notes

Proofra uses Arc as the settlement layer for campaign funding and milestone outcomes.

## Network

| Item | Value |
| --- | --- |
| Network | Arc Testnet |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| WebSocket | `wss://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Gas token | USDC |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` |

## Decimal Rule

Arc's native USDC balance is used for gas and has 18 decimals. The optional ERC-20 USDC interface has 6 decimals and exposes `transferFrom`, `approve`, and allowance flows.

Proofra uses the ERC-20 interface for campaign contributions, creator bonds, payouts, and refunds. The frontend formats all campaign values with 6 decimals.

## Onchain Data

Proofra writes only settlement-critical data to Arc:

- campaign creation;
- contribution amounts;
- creator bond lock;
- milestone payout schedule;
- evidence URI and evidence hash;
- weighted backer votes;
- milestone approval or rejection;
- creator payouts;
- refunds.

Large media, long descriptions, comments, and rich profile data should stay offchain and be referenced through immutable URIs or content hashes.

## App Kits Roadmap

The MVP is Arc-native USDC only. Arc App Kits can be added later for:

- bridging USDC from other chains into Arc;
- swaps into USDC before contribution;
- unified balances for backers with USDC spread across multiple chains.

The current code keeps the App Kit dependency out of the first release so the escrow and milestone mechanism remains easy to audit.
