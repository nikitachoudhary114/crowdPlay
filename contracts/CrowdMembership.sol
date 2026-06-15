// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdMembership is ERC721, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => bool) public hasDoubleVoting;
    mapping(address => bool) public hasMembership;

    constructor() ERC721("CrowdPlay Membership", "CPM") Ownable(msg.sender) {}

    function mintMembership(address to) external onlyOwner returns (uint256) {
        require(!hasMembership[to], "Already has membership");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        hasDoubleVoting[tokenId] = true;
        hasMembership[to] = true;
        return tokenId;
    }

    function tokenURI(uint256) public pure override returns (string memory) {
        return "https://crowdplay.app/api/nft/metadata";
    }
}
