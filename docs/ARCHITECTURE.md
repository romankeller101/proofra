# Proofra Architecture

Proofra turns crowdfunding into rule-based escrow.

## Actors

- **Creator:** launches a campaign, locks a creator bond, submits milestone evidence, receives accepted milestone payouts.
- **Backer:** contributes USDC, receives a non-transferable receipt, votes on milestone evidence, claims refunds when a campaign fails.
- **Arbiter:** a multisig or operational council that can resolve disputed milestones but cannot redirect funds.
- **Treasury:** receives the platform fee only from accepted payouts.

## Contract Model

### `ProofraFactory`

Creates campaign vaults with immutable campaign rules:

- creator address;
- goal;
- funding deadline;
- review period;
- creator bond;
- payout schedule;
- arbiter address;
- fee treasury.

The factory also wires each campaign into `BackerReceipt` and `EvidenceRegistry`.

### `ProofraCampaign`

The campaign vault holds USDC and enforces the campaign lifecycle:

```text
Funding -> Active -> Review -> Active/Succeeded
Funding -> Failed
Review -> Failed
Active/Review -> Paused -> Active/Review
```

Funds move only through:

- `contribute`;
- `lockCreatorBond`;
- accepted milestone payout;
- `claimRefund`;
- creator bond release.

### `EvidenceRegistry`

Stores evidence URI/hash submissions per campaign and milestone.

### `BackerReceipt`

Mints a non-transferable receipt for the first contribution from each backer. It is not a speculative token and cannot be transferred.

## Refund Model

If funding fails, backers can claim their contributed amount and the creator can withdraw the bond.

If a milestone fails, backers share the remaining campaign balance plus the forfeited creator bond:

```text
refund = backer contribution / total contribution * refund pool
```

Already released milestone payouts remain final.

## Production Checklist

- External Solidity audit.
- Formal invariants for payout/refund accounting.
- Multisig arbiter policy and public incident process.
- Offchain evidence storage with immutable hashes.
- Indexer for campaign state and receipt history.
- Compliance screening for restricted jurisdictions and blocklisted addresses.
