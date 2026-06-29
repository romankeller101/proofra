// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BackerReceipt} from "./BackerReceipt.sol";
import {EvidenceRegistry} from "./EvidenceRegistry.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {ProofraCampaign} from "./ProofraCampaign.sol";

contract ProofraFactory {
    error NotOwner();
    error InvalidAddress();

    IERC20 public immutable usdc;
    BackerReceipt public immutable receipt;
    EvidenceRegistry public immutable evidenceRegistry;
    address public owner;
    address public feeTreasury;
    address public arbiter;
    uint16 public platformFeeBps;

    address[] public campaigns;

    event CampaignCreated(address indexed campaign, address indexed creator, string metadataURI, uint256 goal);
    event TreasuryUpdated(address indexed treasury);
    event ArbiterUpdated(address indexed arbiter);
    event PlatformFeeUpdated(uint16 platformFeeBps);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(IERC20 usdc_, address feeTreasury_, address arbiter_, uint16 platformFeeBps_) {
        if (address(usdc_) == address(0) || feeTreasury_ == address(0) || arbiter_ == address(0)) {
            revert InvalidAddress();
        }

        owner = msg.sender;
        usdc = usdc_;
        feeTreasury = feeTreasury_;
        arbiter = arbiter_;
        platformFeeBps = platformFeeBps_;
        receipt = new BackerReceipt(address(this));
        evidenceRegistry = new EvidenceRegistry(address(this));
    }

    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    function createCampaign(
        string calldata metadataURI,
        uint256 goal,
        uint256 fundingDeadline,
        uint256 creatorBond,
        uint256 reviewPeriod,
        ProofraCampaign.MilestoneInput[] calldata milestoneInputs
    ) external returns (address campaign) {
        ProofraCampaign.CampaignConfig memory config = ProofraCampaign.CampaignConfig({
            creator: msg.sender,
            usdc: usdc,
            receipt: receipt,
            evidenceRegistry: evidenceRegistry,
            feeTreasury: feeTreasury,
            arbiter: arbiter,
            metadataURI: metadataURI,
            goal: goal,
            fundingDeadline: fundingDeadline,
            creatorBond: creatorBond,
            reviewPeriod: reviewPeriod,
            platformFeeBps: platformFeeBps
        });

        ProofraCampaign deployed = new ProofraCampaign(config, milestoneInputs);
        campaign = address(deployed);

        campaigns.push(campaign);
        receipt.setMinter(campaign, true);
        evidenceRegistry.setCampaign(campaign, true);

        emit CampaignCreated(campaign, msg.sender, metadataURI, goal);
    }

    function setFeeTreasury(address feeTreasury_) external onlyOwner {
        if (feeTreasury_ == address(0)) revert InvalidAddress();
        feeTreasury = feeTreasury_;
        emit TreasuryUpdated(feeTreasury_);
    }

    function setArbiter(address arbiter_) external onlyOwner {
        if (arbiter_ == address(0)) revert InvalidAddress();
        arbiter = arbiter_;
        emit ArbiterUpdated(arbiter_);
    }

    function setPlatformFeeBps(uint16 platformFeeBps_) external onlyOwner {
        platformFeeBps = platformFeeBps_;
        emit PlatformFeeUpdated(platformFeeBps_);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) revert InvalidAddress();
        owner = nextOwner;
    }
}
