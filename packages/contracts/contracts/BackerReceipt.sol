// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BackerReceipt {
    error NotFactory();
    error NotMinter();
    error Soulbound();
    error InvalidRecipient();
    error UnknownToken();

    string public constant name = "Proofra Backer Receipt";
    string public constant symbol = "PBR";

    address public immutable factory;
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public minters;
    mapping(uint256 => string) private tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event MinterUpdated(address indexed minter, bool enabled);

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    modifier onlyMinter() {
        if (!minters[msg.sender]) revert NotMinter();
        _;
    }

    constructor(address factory_) {
        if (factory_ == address(0)) revert InvalidRecipient();
        factory = factory_;
    }

    function setMinter(address minter, bool enabled) external onlyFactory {
        minters[minter] = enabled;
        emit MinterUpdated(minter, enabled);
    }

    function mint(address to, string calldata uri) external onlyMinter returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidRecipient();

        tokenId = ++totalSupply;
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        tokenURIs[tokenId] = uri;

        emit Transfer(address(0), to, tokenId);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (ownerOf[tokenId] == address(0)) revert UnknownToken();
        return tokenURIs[tokenId];
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }
}
