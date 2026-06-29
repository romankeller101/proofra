// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EvidenceRegistry {
    error NotOwner();
    error NotCampaign();
    error EmptyEvidence();

    struct Evidence {
        address submitter;
        string uri;
        bytes32 contentHash;
        uint256 submittedAt;
    }

    address public immutable owner;

    mapping(address => bool) public campaigns;
    mapping(address => mapping(uint256 => Evidence[])) private evidenceByCampaign;

    event CampaignUpdated(address indexed campaign, bool enabled);
    event EvidenceSubmitted(
        address indexed campaign,
        uint256 indexed milestoneId,
        address indexed submitter,
        string uri,
        bytes32 contentHash
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyCampaign() {
        if (!campaigns[msg.sender]) revert NotCampaign();
        _;
    }

    constructor(address owner_) {
        owner = owner_;
    }

    function setCampaign(address campaign, bool enabled) external onlyOwner {
        campaigns[campaign] = enabled;
        emit CampaignUpdated(campaign, enabled);
    }

    function registerEvidence(
        uint256 milestoneId,
        address submitter,
        string calldata uri,
        bytes32 contentHash
    ) external onlyCampaign returns (uint256 evidenceId) {
        if (bytes(uri).length == 0 && contentHash == bytes32(0)) revert EmptyEvidence();

        Evidence[] storage entries = evidenceByCampaign[msg.sender][milestoneId];
        entries.push(
            Evidence({
                submitter: submitter,
                uri: uri,
                contentHash: contentHash,
                submittedAt: block.timestamp
            })
        );

        evidenceId = entries.length - 1;
        emit EvidenceSubmitted(msg.sender, milestoneId, submitter, uri, contentHash);
    }

    function evidenceCount(address campaign, uint256 milestoneId) external view returns (uint256) {
        return evidenceByCampaign[campaign][milestoneId].length;
    }

    function evidence(address campaign, uint256 milestoneId, uint256 evidenceId) external view returns (Evidence memory) {
        return evidenceByCampaign[campaign][milestoneId][evidenceId];
    }
}
