import { ethers } from "hardhat";

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdc = process.env.ARC_USDC_ADDRESS ?? ARC_USDC_ADDRESS;
  const treasury = process.env.FEE_TREASURY ?? deployer.address;
  const arbiter = process.env.ARBITER ?? deployer.address;
  const platformFeeBps = Number(process.env.PLATFORM_FEE_BPS ?? "250");

  console.log("Deploying ProofraFactory");
  console.log("Deployer:", deployer.address);
  console.log("USDC:", usdc);
  console.log("Treasury:", treasury);
  console.log("Arbiter:", arbiter);
  console.log("Platform fee bps:", platformFeeBps);

  const factory = await ethers.deployContract("ProofraFactory", [usdc, treasury, arbiter, platformFeeBps]);
  await factory.waitForDeployment();

  console.log("ProofraFactory:", await factory.getAddress());
  console.log("BackerReceipt:", await factory.receipt());
  console.log("EvidenceRegistry:", await factory.evidenceRegistry());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
