import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const usdc = (value: string) => ethers.parseUnits(value, 6);
const DAY = 24 * 60 * 60;

function criteriaHash(label: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(label));
}

async function deployFixture() {
  const [deployer, creator, backerA, backerB, treasury, arbiter] = await ethers.getSigners();

  const token = await ethers.deployContract("MockUSDC");
  const factory = await ethers.deployContract("ProofraFactory", [
    await token.getAddress(),
    treasury.address,
    arbiter.address,
    250
  ]);

  await token.mint(creator.address, usdc("5000"));
  await token.mint(backerA.address, usdc("10000"));
  await token.mint(backerB.address, usdc("10000"));

  const now = await time.latest();
  const milestoneInputs = [
    { title: "Working proof", payoutBps: 1000, criteriaHash: criteriaHash("working-proof") },
    { title: "Backer alpha", payoutBps: 2500, criteriaHash: criteriaHash("backer-alpha") },
    { title: "Public beta", payoutBps: 3500, criteriaHash: criteriaHash("public-beta") },
    { title: "Launch delivery", payoutBps: 3000, criteriaHash: criteriaHash("launch-delivery") }
  ];

  const tx = await factory
    .connect(creator)
    .createCampaign("ipfs://proofra/campaign-1", usdc("10000"), now + 7 * DAY, usdc("1000"), 3 * DAY, milestoneInputs);
  const receipt = await tx.wait();
  const logs = await factory.queryFilter(factory.filters.CampaignCreated(), receipt?.blockNumber, receipt?.blockNumber);
  const campaignAddress = logs[0].args.campaign;
  const campaign = await ethers.getContractAt("ProofraCampaign", campaignAddress);
  const backerReceipt = await ethers.getContractAt("BackerReceipt", await factory.receipt());
  const evidenceRegistry = await ethers.getContractAt("EvidenceRegistry", await factory.evidenceRegistry());

  return {
    deployer,
    creator,
    backerA,
    backerB,
    treasury,
    arbiter,
    token,
    factory,
    campaign,
    campaignAddress,
    backerReceipt,
    evidenceRegistry
  };
}

describe("ProofraCampaign", function () {
  it("releases only the accepted milestone payout and keeps the campaign active", async function () {
    const { creator, backerA, backerB, treasury, token, campaign, campaignAddress, backerReceipt, evidenceRegistry } =
      await deployFixture();

    await token.connect(creator).approve(campaignAddress, usdc("1000"));
    await campaign.connect(creator).lockCreatorBond();

    await token.connect(backerA).approve(campaignAddress, usdc("4000"));
    await campaign.connect(backerA).contribute(usdc("4000"), "ipfs://receipt/a");

    await token.connect(backerB).approve(campaignAddress, usdc("6000"));
    await campaign.connect(backerB).contribute(usdc("6000"), "ipfs://receipt/b");

    expect(await backerReceipt.ownerOf(1)).to.equal(backerA.address);
    expect(await backerReceipt.ownerOf(2)).to.equal(backerB.address);

    await campaign.activate();
    await campaign.connect(creator).submitEvidence(0, "ipfs://evidence/m1", criteriaHash("m1-evidence"));

    expect(await evidenceRegistry.evidenceCount(campaignAddress, 0)).to.equal(1);

    await campaign.connect(backerA).voteMilestone(true);
    await campaign.connect(backerB).voteMilestone(true);

    await time.increase(3 * DAY + 1);

    await expect(campaign.finalizeMilestone()).to.emit(campaign, "MilestoneAccepted");

    expect(await campaign.currentMilestone()).to.equal(1);
    expect(await campaign.paidOut()).to.equal(usdc("1000"));
    expect(await token.balanceOf(treasury.address)).to.equal(usdc("25"));
    expect(await token.balanceOf(creator.address)).to.equal(usdc("4975"));
    expect(await campaign.state()).to.equal(1);
  });

  it("moves the remaining balance and creator bond into the refund pool when a milestone is rejected", async function () {
    const { creator, backerA, backerB, token, campaign, campaignAddress } = await deployFixture();

    await token.connect(creator).approve(campaignAddress, usdc("1000"));
    await campaign.connect(creator).lockCreatorBond();

    await token.connect(backerA).approve(campaignAddress, usdc("7000"));
    await campaign.connect(backerA).contribute(usdc("7000"), "ipfs://receipt/a");

    await token.connect(backerB).approve(campaignAddress, usdc("3000"));
    await campaign.connect(backerB).contribute(usdc("3000"), "ipfs://receipt/b");

    await campaign.activate();
    await campaign.connect(creator).submitEvidence(0, "ipfs://evidence/m1", criteriaHash("weak-evidence"));

    await campaign.connect(backerA).voteMilestone(false);
    await campaign.connect(backerB).voteMilestone(true);

    await time.increase(3 * DAY + 1);

    await expect(campaign.finalizeMilestone()).to.emit(campaign, "MilestoneRejected");

    expect(await campaign.state()).to.equal(4);
    expect(await campaign.creatorBondForfeited()).to.equal(true);
    expect(await campaign.refundPool()).to.equal(usdc("11000"));

    await expect(campaign.connect(backerA).claimRefund())
      .to.emit(campaign, "RefundClaimed")
      .withArgs(backerA.address, usdc("7700"));
    await expect(campaign.connect(backerB).claimRefund())
      .to.emit(campaign, "RefundClaimed")
      .withArgs(backerB.address, usdc("3300"));
  });

  it("keeps backer receipts soulbound", async function () {
    const { creator, backerA, backerB, token, campaign, campaignAddress, backerReceipt } = await deployFixture();

    await token.connect(creator).approve(campaignAddress, usdc("1000"));
    await campaign.connect(creator).lockCreatorBond();
    await token.connect(backerA).approve(campaignAddress, usdc("1000"));
    await campaign.connect(backerA).contribute(usdc("1000"), "ipfs://receipt/a");

    await expect(backerReceipt.connect(backerA).transferFrom(backerA.address, backerB.address, 1)).to.be.revertedWithCustomError(
      backerReceipt,
      "Soulbound"
    );
  });
});
