# Product Spec

## Positioning

Proofra is milestone crowdfunding on Arc.

The core promise is simple:

> Fund progress, not promises.

Backers do not send USDC directly to a creator. They send USDC into a public campaign vault. The creator unlocks funds gradually after milestone evidence is submitted and accepted.

## MVP Users

Proofra starts with categories where delivery can be publicly verified:

- indie games;
- web3 products;
- open-source tools;
- small SaaS products;
- education projects;
- design and media projects;
- community tools;
- AI tools.

The MVP excludes token sales, yield promises, trading pools, equity sales, and legally complex personal, medical, or charity fundraising.

## Campaign Lifecycle

1. Creator connects an EVM wallet on Arc Testnet.
2. Creator defines campaign metadata, goal, creator bond, funding deadline, and milestone payout schedule.
3. Creator locks the creator bond.
4. Backers contribute USDC and receive soulbound receipts.
5. When the goal is reached, the campaign becomes active.
6. Creator submits milestone evidence URI/hash.
7. Backers vote support or dispute during the review window.
8. If accepted, the contract releases only that milestone payout.
9. If rejected, the remaining balance and forfeited bond become refundable.
10. If all milestones are accepted, the campaign succeeds and the creator bond is released.

## UX Principles

- Show money state before marketing copy.
- Make first payout size visible because it is the first-loss boundary.
- Show creator bond, review window, and refund path on every campaign page.
- Use external evidence links and hashes rather than mutable claims.
- Avoid speculative language and token-price framing.

## Revenue

Proofra earns from successful progress:

- platform fee on accepted milestone payouts;
- optional arbitration and infrastructure reserve;
- future premium analytics, campaign pages, and API access.

The creator bond is not platform revenue unless protocol rules explicitly forfeit it after a failed milestone.
