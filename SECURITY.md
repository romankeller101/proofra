# Security Policy

Proofra handles escrow logic and should be treated as financial software.

## Current Status

This repository is an MVP implementation for Arc Testnet. It is not audited and must not be used for production fundraising until a full review is complete.

## Required Before Mainnet

- Independent Solidity audit.
- Invariant testing for payout, refund, and creator bond accounting.
- Review of Arc-specific USDC behavior, especially ERC-20 6-decimal transfers versus native 18-decimal gas balance.
- Operational policy for the arbiter multisig.
- Monitoring for failed transfers, stuck campaign states, and refund dust.
- Legal and compliance review for crowdfunding categories and jurisdictions.

## Reporting

Please report vulnerabilities privately to the project maintainers. Do not open public issues for exploitable bugs before a fix is available.

## Non-Goals

Proofra does not guarantee that every creator is honest. The protocol reduces the maximum loss by limiting payouts, requiring evidence, locking creator bond, and keeping unused funds refundable.
