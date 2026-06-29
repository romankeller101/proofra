// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BackerReceipt} from "./BackerReceipt.sol";
import {EvidenceRegistry} from "./EvidenceRegistry.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {ReentrancyGuard} from "./ReentrancyGuard.sol";

contract ProofraCampaign is ReentrancyGuard {
    using SafeTransferLib for IERC20;

    uint16 public constant BPS_DENOMINATOR = 10_000;

    enum CampaignState {
        Funding,
        Active,
        Review,
        Succeeded,
        Failed,
        Paused
    }

    enum MilestoneStatus {
        Waiting,
        UnderReview,
        Accepted,
        Rejected
    }

    struct MilestoneInput {
        string title;
        uint16 payoutBps;
        bytes32 criteriaHash;
    }

    struct Milestone {
        string title;
        uint16 payoutBps;
        bytes32 criteriaHash;
        string evidenceURI;
        bytes32 evidenceHash;
        uint256 reviewDeadline;
        uint256 supportWeight;
        uint256 disputeWeight;
        MilestoneStatus status;
    }

    struct CampaignConfig {
        address creator;
        IERC20 usdc;
        BackerReceipt receipt;
        EvidenceRegistry evidenceRegistry;
        address feeTreasury;
        address arbiter;
        string metadataURI;
        uint256 goal;
        uint256 fundingDeadline;
        uint256 creatorBond;
        uint256 reviewPeriod;
        uint16 platformFeeBps;
    }

    error NotCreator();
    error NotArbiter();
    error NotBacker();
    error InvalidState();
    error InvalidAmount();
    error InvalidMilestone();
    error InvalidConfig();
    error AlreadyVoted();
    error RefundUnavailable();
    error BondUnavailable();

    IERC20 public immutable usdc;
    BackerReceipt public immutable receipt;
    EvidenceRegistry public immutable evidenceRegistry;
    address public immutable creator;
    address public immutable feeTreasury;
    address public immutable arbiter;
    string public metadataURI;
    uint256 public immutable goal;
    uint256 public immutable fundingDeadline;
    uint256 public immutable creatorBond;
    uint256 public immutable reviewPeriod;
    uint16 public immutable platformFeeBps;

    CampaignState public state;
    CampaignState private pausedState;
    bool public bondLocked;
    bool public creatorBondForfeited;
    bool public creatorBondReleased;
    uint256 public totalRaised;
    uint256 public paidOut;
    uint256 public currentMilestone;
    uint256 public refundPool;

    Milestone[] private milestones;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public receiptTokenId;
    mapping(address => bool) public refundClaimed;
    mapping(uint256 => mapping(address => uint8)) public votes;

    event CreatorBondLocked(address indexed creator, uint256 amount);
    event ContributionReceived(address indexed backer, uint256 amount, uint256 totalRaised);
    event CampaignActivated(uint256 totalRaised);
    event FundingFailed(uint256 totalRaised);
    event EvidenceSubmitted(uint256 indexed milestoneId, string uri, bytes32 contentHash, uint256 reviewDeadline);
    event MilestoneVoted(uint256 indexed milestoneId, address indexed backer, bool support, uint256 weight);
    event MilestoneAccepted(uint256 indexed milestoneId, uint256 creatorAmount, uint256 feeAmount);
    event MilestoneRejected(uint256 indexed milestoneId, uint256 refundPool);
    event RefundClaimed(address indexed backer, uint256 amount);
    event CreatorBondReleased(address indexed creator, uint256 amount);
    event CampaignPaused(CampaignState previousState);
    event CampaignResumed(CampaignState restoredState);

    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    constructor(CampaignConfig memory config, MilestoneInput[] memory milestoneInputs) {
        if (
            config.creator == address(0) || address(config.usdc) == address(0) || address(config.receipt) == address(0)
                || address(config.evidenceRegistry) == address(0) || config.feeTreasury == address(0)
                || config.arbiter == address(0) || config.goal == 0 || config.fundingDeadline <= block.timestamp
                || config.reviewPeriod == 0 || milestoneInputs.length == 0 || config.platformFeeBps > 1_000
        ) {
            revert InvalidConfig();
        }

        uint256 totalBps;
        for (uint256 i = 0; i < milestoneInputs.length; i++) {
            if (milestoneInputs[i].payoutBps == 0) revert InvalidConfig();
            totalBps += milestoneInputs[i].payoutBps;
            milestones.push(
                Milestone({
                    title: milestoneInputs[i].title,
                    payoutBps: milestoneInputs[i].payoutBps,
                    criteriaHash: milestoneInputs[i].criteriaHash,
                    evidenceURI: "",
                    evidenceHash: bytes32(0),
                    reviewDeadline: 0,
                    supportWeight: 0,
                    disputeWeight: 0,
                    status: MilestoneStatus.Waiting
                })
            );
        }

        if (totalBps != BPS_DENOMINATOR) revert InvalidConfig();

        creator = config.creator;
        usdc = config.usdc;
        receipt = config.receipt;
        evidenceRegistry = config.evidenceRegistry;
        feeTreasury = config.feeTreasury;
        arbiter = config.arbiter;
        metadataURI = config.metadataURI;
        goal = config.goal;
        fundingDeadline = config.fundingDeadline;
        creatorBond = config.creatorBond;
        reviewPeriod = config.reviewPeriod;
        platformFeeBps = config.platformFeeBps;
        state = CampaignState.Funding;
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function milestone(uint256 milestoneId) external view returns (Milestone memory) {
        if (milestoneId >= milestones.length) revert InvalidMilestone();
        return milestones[milestoneId];
    }

    function lockCreatorBond() external onlyCreator nonReentrant {
        if (state != CampaignState.Funding || bondLocked) revert InvalidState();
        if (creatorBond == 0) revert InvalidAmount();

        bondLocked = true;
        usdc.safeTransferFrom(msg.sender, address(this), creatorBond);

        emit CreatorBondLocked(msg.sender, creatorBond);
    }

    function contribute(uint256 amount, string calldata receiptURI) external nonReentrant {
        if (state != CampaignState.Funding || block.timestamp > fundingDeadline) revert InvalidState();
        if (amount == 0 || totalRaised + amount > goal) revert InvalidAmount();

        totalRaised += amount;
        contributions[msg.sender] += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        if (receiptTokenId[msg.sender] == 0) {
            receiptTokenId[msg.sender] = receipt.mint(msg.sender, receiptURI);
        }

        emit ContributionReceived(msg.sender, amount, totalRaised);
    }

    function activate() external {
        if (state != CampaignState.Funding || !bondLocked || totalRaised < goal) revert InvalidState();
        state = CampaignState.Active;
        emit CampaignActivated(totalRaised);
    }

    function markFundingFailed() external {
        if (state != CampaignState.Funding || block.timestamp <= fundingDeadline || totalRaised >= goal) {
            revert InvalidState();
        }

        state = CampaignState.Failed;
        refundPool = totalRaised;

        emit FundingFailed(totalRaised);
    }

    function submitEvidence(uint256 milestoneId, string calldata uri, bytes32 contentHash) external onlyCreator {
        if (state != CampaignState.Active || milestoneId != currentMilestone || milestoneId >= milestones.length) {
            revert InvalidMilestone();
        }

        Milestone storage item = milestones[milestoneId];
        if (item.status != MilestoneStatus.Waiting) revert InvalidState();

        item.evidenceURI = uri;
        item.evidenceHash = contentHash;
        item.reviewDeadline = block.timestamp + reviewPeriod;
        item.status = MilestoneStatus.UnderReview;
        state = CampaignState.Review;

        evidenceRegistry.registerEvidence(milestoneId, msg.sender, uri, contentHash);

        emit EvidenceSubmitted(milestoneId, uri, contentHash, item.reviewDeadline);
    }

    function voteMilestone(bool support) external {
        if (state != CampaignState.Review) revert InvalidState();
        uint256 weight = contributions[msg.sender];
        if (weight == 0) revert NotBacker();

        Milestone storage item = milestones[currentMilestone];
        if (block.timestamp > item.reviewDeadline) revert InvalidState();
        if (votes[currentMilestone][msg.sender] != 0) revert AlreadyVoted();

        votes[currentMilestone][msg.sender] = support ? 1 : 2;

        if (support) {
            item.supportWeight += weight;
        } else {
            item.disputeWeight += weight;
        }

        emit MilestoneVoted(currentMilestone, msg.sender, support, weight);
    }

    function finalizeMilestone() external nonReentrant {
        if (state != CampaignState.Review) revert InvalidState();
        Milestone storage item = milestones[currentMilestone];
        if (block.timestamp <= item.reviewDeadline) revert InvalidState();

        if (item.disputeWeight > item.supportWeight) {
            _rejectMilestone(item);
        } else {
            _acceptMilestone(item);
        }
    }

    function arbiterApproveMilestone() external onlyArbiter nonReentrant {
        if (state != CampaignState.Review) revert InvalidState();
        _acceptMilestone(milestones[currentMilestone]);
    }

    function arbiterRejectMilestone() external onlyArbiter nonReentrant {
        if (state != CampaignState.Review) revert InvalidState();
        _rejectMilestone(milestones[currentMilestone]);
    }

    function pauseCampaign() external onlyArbiter {
        if (state != CampaignState.Active && state != CampaignState.Review) revert InvalidState();
        pausedState = state;
        state = CampaignState.Paused;
        emit CampaignPaused(pausedState);
    }

    function resumeCampaign() external onlyArbiter {
        if (state != CampaignState.Paused) revert InvalidState();
        state = pausedState;
        emit CampaignResumed(state);
    }

    function claimRefund() external nonReentrant {
        if (state != CampaignState.Failed || refundClaimed[msg.sender]) revert RefundUnavailable();
        uint256 contribution = contributions[msg.sender];
        if (contribution == 0 || totalRaised == 0 || refundPool == 0) revert RefundUnavailable();

        refundClaimed[msg.sender] = true;
        uint256 amount = (contribution * refundPool) / totalRaised;
        usdc.safeTransfer(msg.sender, amount);

        emit RefundClaimed(msg.sender, amount);
    }

    function releaseCreatorBond() external onlyCreator nonReentrant {
        bool fundingFailedWithoutFault = state == CampaignState.Failed && !creatorBondForfeited && refundPool == totalRaised;
        bool completed = state == CampaignState.Succeeded;

        if (creatorBondReleased || !bondLocked || (!completed && !fundingFailedWithoutFault)) revert BondUnavailable();

        creatorBondReleased = true;
        usdc.safeTransfer(creator, creatorBond);

        emit CreatorBondReleased(creator, creatorBond);
    }

    function _acceptMilestone(Milestone storage item) private {
        item.status = MilestoneStatus.Accepted;

        uint256 grossPayout = (goal * item.payoutBps) / BPS_DENOMINATOR;
        uint256 feeAmount = (grossPayout * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorAmount = grossPayout - feeAmount;

        paidOut += grossPayout;

        if (feeAmount > 0) {
            usdc.safeTransfer(feeTreasury, feeAmount);
        }
        usdc.safeTransfer(creator, creatorAmount);

        emit MilestoneAccepted(currentMilestone, creatorAmount, feeAmount);

        if (currentMilestone + 1 == milestones.length) {
            state = CampaignState.Succeeded;
        } else {
            currentMilestone += 1;
            state = CampaignState.Active;
        }
    }

    function _rejectMilestone(Milestone storage item) private {
        item.status = MilestoneStatus.Rejected;
        state = CampaignState.Failed;
        creatorBondForfeited = bondLocked;
        refundPool = usdc.balanceOf(address(this));

        emit MilestoneRejected(currentMilestone, refundPool);
    }
}
