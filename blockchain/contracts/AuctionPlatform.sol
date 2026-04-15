// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AuctionPlatform
 * @notice P2P auction platform with collateral-based escrow.
 *         Seller pays collateral to prevent fraud (no shipping).
 *         Buyer's bid is held in escrow until delivery confirmed.
 */
contract AuctionPlatform is ReentrancyGuard {
    // ── Enums ────────────────────────────────────────────────────────────────

    enum AuctionStatus {
        Pending,    // Created, waiting for on-chain confirmation (unused in contract, for DB mirror)
        Active,     // Accepting bids
        Ended,      // Time expired or manually ended
        Canceled    // Canceled before any bid
    }

    enum EscrowStatus {
        None,
        AwaitingDelivery,
        Disputed,
        Completed,
        Refunded
    }

    // ── Structs ──────────────────────────────────────────────────────────────

    struct Auction {
        address payable seller;
        uint256 startingPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 endTime;
        uint256 collateral;        // Seller's locked collateral
        string productCid;         // IPFS CID from Pinata
        AuctionStatus status;
        EscrowStatus escrowStatus;
    }

    // ── State Variables ──────────────────────────────────────────────────────

    address public admin;
    uint256 public auctionCount;

    // Collateral ratio: 10% of startingPrice (in basis points: 1000 / 10000)
    uint256 public constant COLLATERAL_BPS = 1000;

    mapping(uint256 => Auction) public auctions;

    // Pull-payment pattern: tracks refundable amounts per bidder per auction
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    // ── Events ───────────────────────────────────────────────────────────────

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime,
        string productCid
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event AuctionCanceled(uint256 indexed auctionId);

    event DeliveryConfirmed(uint256 indexed auctionId, address indexed buyer);

    event DisputeRaised(uint256 indexed auctionId, address indexed raisedBy);

    event DisputeResolved(
        uint256 indexed auctionId,
        bool refundBuyer,
        address indexed resolvedBy
    );

    event Withdrawal(address indexed user, uint256 amount);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "AuctionPlatform: caller is not admin");
        _;
    }

    modifier onlySeller(uint256 _auctionId) {
        require(
            msg.sender == auctions[_auctionId].seller,
            "AuctionPlatform: caller is not seller"
        );
        _;
    }

    modifier onlyWinner(uint256 _auctionId) {
        require(
            msg.sender == auctions[_auctionId].highestBidder,
            "AuctionPlatform: caller is not winner"
        );
        _;
    }

    modifier auctionExists(uint256 _auctionId) {
        require(_auctionId > 0 && _auctionId <= auctionCount, "AuctionPlatform: auction does not exist");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        // Deployer becomes admin
        admin = msg.sender;
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Create a new auction. Seller must send ETH as collateral.
     * @param _startingPrice Minimum bid amount in wei
     * @param _duration Auction duration in seconds
     * @param _productCid IPFS CID of product metadata
     */
    function createAuction(
        uint256 _startingPrice,
        uint256 _duration,
        string calldata _productCid
    ) external payable nonReentrant {
        require(_startingPrice > 0, "AuctionPlatform: starting price must be > 0");
        require(_duration > 0, "AuctionPlatform: duration must be > 0");
        require(bytes(_productCid).length > 0, "AuctionPlatform: product CID required");

        // Collateral must be exactly 10% of starting price
        uint256 minCollateral = (_startingPrice * COLLATERAL_BPS) / 10000;
        require(msg.value >= minCollateral, "AuctionPlatform: insufficient collateral");

        auctionCount++;
        uint256 newAuctionId = auctionCount;

        auctions[newAuctionId] = Auction({
            seller: payable(msg.sender),
            startingPrice: _startingPrice,
            highestBid: 0,
            highestBidder: payable(address(0)),
            endTime: block.timestamp + _duration,
            collateral: msg.value,
            productCid: _productCid,
            status: AuctionStatus.Active,
            escrowStatus: EscrowStatus.None
        });

        emit AuctionCreated(
            newAuctionId,
            msg.sender,
            _startingPrice,
            block.timestamp + _duration,
            _productCid
        );
    }

    /**
     * @notice Place a bid. Bid amount = msg.value. Must exceed current highest bid.
     * @param _auctionId Target auction
     */
    function bid(uint256 _auctionId) external payable nonReentrant auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(auction.status == AuctionStatus.Active, "AuctionPlatform: auction not active");
        require(block.timestamp < auction.endTime, "AuctionPlatform: auction has ended");
        require(msg.sender != auction.seller, "AuctionPlatform: seller cannot bid");
        require(
            msg.value > auction.highestBid && msg.value >= auction.startingPrice,
            "AuctionPlatform: bid too low"
        );

        // Queue previous highest bidder's refund (pull pattern)
        if (auction.highestBidder != address(0)) {
            pendingReturns[_auctionId][auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    /**
     * @notice Withdraw outbid funds. Pull pattern — bidder must call this themselves.
     * @param _auctionId Auction to withdraw from
     */
    function withdraw(uint256 _auctionId) external nonReentrant auctionExists(_auctionId) {
        uint256 amount = pendingReturns[_auctionId][msg.sender];
        require(amount > 0, "AuctionPlatform: nothing to withdraw");

        // Reset before transfer — prevent reentrancy
        pendingReturns[_auctionId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "AuctionPlatform: withdrawal failed");

        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice End auction after endTime. Anyone can call.
     * @param _auctionId Target auction
     */
    function endAuction(uint256 _auctionId) external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(auction.status == AuctionStatus.Active, "AuctionPlatform: auction not active");
        require(block.timestamp >= auction.endTime, "AuctionPlatform: auction not yet ended");

        auction.status = AuctionStatus.Ended;

        if (auction.highestBidder != address(0)) {
            // Lock funds — awaiting delivery confirmation
            auction.escrowStatus = EscrowStatus.AwaitingDelivery;
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids — return collateral to seller
            auction.escrowStatus = EscrowStatus.Refunded;
            uint256 refund = auction.collateral;
            auction.collateral = 0;
            (bool success, ) = auction.seller.call{value: refund}("");
            require(success, "AuctionPlatform: collateral refund failed");
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    /**
     * @notice Cancel auction before any bid is placed. Only seller.
     * @param _auctionId Target auction
     */
    function cancelAuction(uint256 _auctionId) external nonReentrant onlySeller(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(auction.status == AuctionStatus.Active, "AuctionPlatform: auction not active");
        require(auction.highestBidder == address(0), "AuctionPlatform: cannot cancel with bids");

        auction.status = AuctionStatus.Canceled;
        auction.escrowStatus = EscrowStatus.Refunded;

        // Return collateral to seller
        uint256 refund = auction.collateral;
        auction.collateral = 0;
        (bool success, ) = auction.seller.call{value: refund}("");
        require(success, "AuctionPlatform: collateral refund failed");

        emit AuctionCanceled(_auctionId);
    }

    // ── Escrow Functions ─────────────────────────────────────────────────────

    /**
     * @notice Buyer confirms delivery. Releases funds to seller.
     * @param _auctionId Target auction
     */
    function confirmDelivery(uint256 _auctionId) external nonReentrant onlyWinner(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.escrowStatus == EscrowStatus.AwaitingDelivery,
            "AuctionPlatform: not in AwaitingDelivery state"
        );

        auction.escrowStatus = EscrowStatus.Completed;

        // Release: highestBid + collateral → seller
        uint256 payout = auction.highestBid + auction.collateral;
        auction.highestBid = 0;
        auction.collateral = 0;

        (bool success, ) = auction.seller.call{value: payout}("");
        require(success, "AuctionPlatform: payout to seller failed");

        emit DeliveryConfirmed(_auctionId, msg.sender);
    }

    /**
     * @notice Buyer raises dispute if item not delivered or misrepresented.
     * @param _auctionId Target auction
     */
    function raiseDispute(uint256 _auctionId) external onlyWinner(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.escrowStatus == EscrowStatus.AwaitingDelivery,
            "AuctionPlatform: not in AwaitingDelivery state"
        );

        auction.escrowStatus = EscrowStatus.Disputed;

        emit DisputeRaised(_auctionId, msg.sender);
    }

    /**
     * @notice Admin resolves dispute.
     * @param _auctionId Target auction
     * @param _refundBuyer true = buyer wins (seller loses collateral), false = seller wins
     */
    function resolveDispute(uint256 _auctionId, bool _refundBuyer)
        external
        nonReentrant
        onlyAdmin
        auctionExists(_auctionId)
    {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.escrowStatus == EscrowStatus.Disputed,
            "AuctionPlatform: not in Disputed state"
        );

        auction.escrowStatus = EscrowStatus.Refunded;

        if (_refundBuyer) {
            // Buyer wins: refund highestBid + collateral to buyer (as compensation)
            uint256 totalBuyerPayout = auction.highestBid + auction.collateral;
            auction.highestBid = 0;
            auction.collateral = 0;
            (bool success, ) = auction.highestBidder.call{value: totalBuyerPayout}("");
            require(success, "AuctionPlatform: buyer payout failed");
        } else {
            // Seller wins (buyer acted in bad faith): release funds to seller as normal
            uint256 payout = auction.highestBid + auction.collateral;
            auction.highestBid = 0;
            auction.collateral = 0;
            (bool success, ) = auction.seller.call{value: payout}("");
            require(success, "AuctionPlatform: seller payout failed");
        }

        emit DisputeResolved(_auctionId, _refundBuyer, msg.sender);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    /**
     * @notice Get full auction details. Frontend polls this without sending TX.
     */
    function getAuctionDetails(uint256 _auctionId)
        external
        view
        auctionExists(_auctionId)
        returns (
            address seller,
            uint256 startingPrice,
            uint256 highestBid,
            address highestBidder,
            uint256 endTime,
            uint256 collateral,
            string memory productCid,
            AuctionStatus status,
            EscrowStatus escrowStatus
        )
    {
        Auction storage a = auctions[_auctionId];
        return (
            a.seller,
            a.startingPrice,
            a.highestBid,
            a.highestBidder,
            a.endTime,
            a.collateral,
            a.productCid,
            a.status,
            a.escrowStatus
        );
    }

    /**
     * @notice Calculate required collateral for a given starting price.
     */
    function requiredCollateral(uint256 _startingPrice) external pure returns (uint256) {
        return (_startingPrice * COLLATERAL_BPS) / 10000;
    }

    // ── Admin Functions ───────────────────────────────────────────────────────

    /**
     * @notice Transfer admin role. Two-step ownership transfer should be used in production
     *         (OpenZeppelin Ownable2Step), but for demo single-step is acceptable.
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "AuctionPlatform: zero address");
        admin = _newAdmin;
    }
}
