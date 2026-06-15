// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract QueueBoost is Ownable, ReentrancyGuard {
    IERC20 public crowdToken;
    address public platformTreasury;

    uint256 public boostPrice = 5 ether;
    uint256 public queueJumpPrice = 20 ether;
    uint256 public playNextPrice = 50 ether;

    uint256 public constant CREATOR_SHARE = 70;
    uint256 public constant PLATFORM_SHARE = 30;

    event BoostPurchased(address indexed buyer, bytes32 indexed roomId, bytes32 indexed itemId, uint256 amount, string boostType);
    event SongPromoted(bytes32 indexed roomId, bytes32 indexed itemId, string boostType);
    event CreatorRewarded(address indexed creator, uint256 amount);
    event EarningsWithdrawn(address indexed creator, uint256 amount);

    mapping(address => uint256) public creatorEarnings;

    constructor(address _crowdToken, address _platformTreasury) Ownable(msg.sender) {
        crowdToken = IERC20(_crowdToken);
        platformTreasury = _platformTreasury;
    }

    function buyBoost(bytes32 roomId, bytes32 itemId, string calldata boostType, address creator) external nonReentrant {
        uint256 price = _getPrice(boostType);
        require(crowdToken.transferFrom(msg.sender, address(this), price), "Transfer failed");

        uint256 creatorAmount = (price * CREATOR_SHARE) / 100;
        uint256 platformAmount = price - creatorAmount;

        creatorEarnings[creator] += creatorAmount;
        require(crowdToken.transfer(platformTreasury, platformAmount), "Platform transfer failed");

        emit BoostPurchased(msg.sender, roomId, itemId, price, boostType);
        emit SongPromoted(roomId, itemId, boostType);
        emit CreatorRewarded(creator, creatorAmount);
    }

    function playNext(bytes32 roomId, bytes32 itemId, address creator) external nonReentrant {
        uint256 price = playNextPrice;
        require(crowdToken.transferFrom(msg.sender, address(this), price), "Transfer failed");

        uint256 creatorAmount = (price * CREATOR_SHARE) / 100;
        creatorEarnings[creator] += creatorAmount;
        require(crowdToken.transfer(platformTreasury, price - creatorAmount), "Platform transfer failed");

        emit BoostPurchased(msg.sender, roomId, itemId, price, "PLAY_NEXT");
        emit SongPromoted(roomId, itemId, "PLAY_NEXT");
    }

    function tipCreator(address creator, uint256 amount) external nonReentrant {
        require(crowdToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 creatorAmount = (amount * CREATOR_SHARE) / 100;
        creatorEarnings[creator] += creatorAmount;
        require(crowdToken.transfer(platformTreasury, amount - creatorAmount), "Platform transfer failed");
        emit CreatorRewarded(creator, creatorAmount);
    }

    function withdrawEarnings() external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings");
        creatorEarnings[msg.sender] = 0;
        require(crowdToken.transfer(msg.sender, amount), "Withdraw failed");
        emit EarningsWithdrawn(msg.sender, amount);
    }

    function _getPrice(string calldata boostType) internal view returns (uint256) {
        bytes32 t = keccak256(bytes(boostType));
        if (t == keccak256("VOTE_BOOST")) return boostPrice;
        if (t == keccak256("QUEUE_JUMP")) return queueJumpPrice;
        if (t == keccak256("PLAY_NEXT")) return playNextPrice;
        revert("Invalid boost type");
    }
}
