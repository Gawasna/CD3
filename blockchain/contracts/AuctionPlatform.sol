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
        AwaitingShipment, // Added: Waiting for seller to ship
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
        uint256 shippedTime;       // Added: timestamp when item was shipped
        bytes32 shipmentProofHash; // Added: proof of shipment
    }

    // ── State Variables ──────────────────────────────────────────────────────

    address public admin;
    uint256 public auctionCount;
    uint256 public adminFeeBalance; // Added: Platform fees collected

    // Collateral ratio: 10% of startingPrice (in basis points: 1000 / 10000)
    uint256 public constant COLLATERAL_BPS = 1000;
    
    // Task 1: Minimum Bid Increment (5%)
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;
    
    // Task 2: Minimum Absolute Collateral
    uint256 public constant MIN_COLLATERAL = 0.01 ether;
    
    // Task 3: Auto-release Timeout (14 days)
    uint256 public constant AUTO_RELEASE_TIMEOUT = 14 days;
    
    // Task 4: Anti-sniping
    uint256 public constant EXTENSION_WINDOW = 5 minutes;
    uint256 public constant EXTENSION_DURATION = 5 minutes;
    
    // Task 5: Dispute Bond
    uint256 public constant DISPUTE_BOND = 0.005 ether;
    
    // Task 8: Platform Fee (2%)
    uint256 public constant PLATFORM_FEE_BPS = 200;

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
    
    event ItemShipped(uint256 indexed auctionId, bytes32 shipmentProofHash);

    event DeliveryConfirmed(uint256 indexed auctionId, address indexed buyer);
    
    event AutoReleaseCompleted(uint256 indexed auctionId);

    event DisputeRaised(uint256 indexed auctionId, address indexed raisedBy);

    event DisputeResolved(
        uint256 indexed auctionId,
        uint256 buyerRefundPercentage,
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

        // Task 2: Minimum Absolute Collateral
        uint256 calcCollateral = (_startingPrice * COLLATERAL_BPS) / 10000;
        uint256 minCollateral = calcCollateral > MIN_COLLATERAL ? calcCollateral : MIN_COLLATERAL;
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
            escrowStatus: EscrowStatus.None,
            shippedTime: 0,
            shipmentProofHash: bytes32(0)
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
        
        // Task 1: Minimum Bid Increment
        if (auction.highestBid == 0) {
            require(msg.value >= auction.startingPrice, "AuctionPlatform: bid too low");
        } else {
            uint256 minBid = auction.highestBid + (auction.highestBid * MIN_BID_INCREMENT_BPS) / 10000;
            require(msg.value >= minBid, "AuctionPlatform: bid must meet minimum increment");
        }

        // Task 4: Anti-sniping
        if (auction.endTime - block.timestamp <= EXTENSION_WINDOW) {
            auction.endTime += EXTENSION_DURATION;
        }

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
            // Lock funds — awaiting shipment confirmation
            auction.escrowStatus = EscrowStatus.AwaitingShipment;
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
     * @notice Task 6: Seller marks the item as shipped and provides proof.
     */
    function markShipped(uint256 _auctionId, bytes32 _shipmentProofHash) external nonReentrant onlySeller(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.escrowStatus == EscrowStatus.AwaitingShipment,
            "AuctionPlatform: not in AwaitingShipment state"
        );

        auction.escrowStatus = EscrowStatus.AwaitingDelivery;
        auction.shippedTime = block.timestamp;
        auction.shipmentProofHash = _shipmentProofHash;

        emit ItemShipped(_auctionId, _shipmentProofHash);
    }

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

        // Task 8: Platform Fee
        uint256 fee = (auction.highestBid * PLATFORM_FEE_BPS) / 10000;
        adminFeeBalance += fee;

        // Release: highestBid - fee + collateral → seller
        uint256 payout = (auction.highestBid - fee) + auction.collateral;
        auction.highestBid = 0;
        auction.collateral = 0;

        (bool success, ) = auction.seller.call{value: payout}("");
        require(success, "AuctionPlatform: payout to seller failed");

        emit DeliveryConfirmed(_auctionId, msg.sender);
    }

    /**
     * @notice Task 3: Seller claims funds if buyer fails to confirm delivery after timeout.
     */
    function claimFunds(uint256 _auctionId) external nonReentrant onlySeller(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.escrowStatus == EscrowStatus.AwaitingDelivery,
            "AuctionPlatform: not in AwaitingDelivery state"
        );
        require(
            block.timestamp >= auction.shippedTime + AUTO_RELEASE_TIMEOUT,
            "AuctionPlatform: timeout not reached"
        );

        auction.escrowStatus = EscrowStatus.Completed;

        // Task 8: Platform Fee
        uint256 fee = (auction.highestBid * PLATFORM_FEE_BPS) / 10000;
        adminFeeBalance += fee;

        // Release: highestBid - fee + collateral → seller
        uint256 payout = (auction.highestBid - fee) + auction.collateral;
        auction.highestBid = 0;
        auction.collateral = 0;

        (bool success, ) = auction.seller.call{value: payout}("");
        require(success, "AuctionPlatform: payout to seller failed");

        emit AutoReleaseCompleted(_auctionId);
    }

    /**
     * @notice Buyer raises dispute if item not delivered or misrepresented.
     * @param _auctionId Target auction
     */
    function raiseDispute(uint256 _auctionId) external payable nonReentrant onlyWinner(_auctionId) auctionExists(_auctionId) {
        // Task 5: Dispute Bond
        require(msg.value == DISPUTE_BOND, "AuctionPlatform: must pay dispute bond");
        Auction storage auction = auctions[_auctionId];

        require(
            auction.escrowStatus == EscrowStatus.AwaitingDelivery || auction.escrowStatus == EscrowStatus.AwaitingShipment,
            "AuctionPlatform: not in valid state to dispute"
        );

        auction.escrowStatus = EscrowStatus.Disputed;

        emit DisputeRaised(_auctionId, msg.sender);
    }

    /**
     * @notice Admin resolves dispute.
     * @param _auctionId Target auction
     * @param _buyerRefundPercentage 0 to 100 representing how much of highestBid is refunded to buyer
     */
    function resolveDispute(uint256 _auctionId, uint256 _buyerRefundPercentage)
        external
        nonReentrant
        onlyAdmin
        auctionExists(_auctionId)
    {
        require(_buyerRefundPercentage <= 100, "AuctionPlatform: percentage > 100");
        Auction storage auction = auctions[_auctionId];

        require(
            auction.escrowStatus == EscrowStatus.Disputed,
            "AuctionPlatform: not in Disputed state"
        );

        auction.escrowStatus = EscrowStatus.Refunded;

        uint256 highestBid = auction.highestBid;
        uint256 collateral = auction.collateral;
        auction.highestBid = 0;
        auction.collateral = 0;

        uint256 buyerRefund = (highestBid * _buyerRefundPercentage) / 100;
        uint256 sellerShareFromBid = highestBid - buyerRefund;
        
        // Take platform fee from seller's share of the bid (Task 8)
        uint256 fee = 0;
        if (sellerShareFromBid > 0) {
            fee = (sellerShareFromBid * PLATFORM_FEE_BPS) / 10000;
            adminFeeBalance += fee;
            sellerShareFromBid -= fee;
        }

        uint256 totalBuyerPayout = buyerRefund;
        uint256 totalSellerPayout = sellerShareFromBid;

        if (_buyerRefundPercentage > 0) {
            // Task 5: Buyer wins partially or fully, return dispute bond
            totalBuyerPayout += DISPUTE_BOND;
            
            // Task 7: Proportional refund of collateral
            uint256 buyerCollateralShare = (collateral * _buyerRefundPercentage) / 100;
            totalBuyerPayout += buyerCollateralShare;
            totalSellerPayout += (collateral - buyerCollateralShare);
        } else {
            // Task 5: Buyer loses, forfeit dispute bond to admin
            adminFeeBalance += DISPUTE_BOND;
            totalSellerPayout += collateral;
        }

        if (totalBuyerPayout > 0) {
            (bool successB, ) = auction.highestBidder.call{value: totalBuyerPayout}("");
            require(successB, "AuctionPlatform: buyer payout failed");
        }
        if (totalSellerPayout > 0) {
            (bool successS, ) = auction.seller.call{value: totalSellerPayout}("");
            require(successS, "AuctionPlatform: seller payout failed");
        }

        emit DisputeResolved(_auctionId, _buyerRefundPercentage, msg.sender);
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
            EscrowStatus escrowStatus,
            uint256 shippedTime,
            bytes32 shipmentProofHash
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
            a.escrowStatus,
            a.shippedTime,
            a.shipmentProofHash
        );
    }

    /**
     * @notice Calculate required collateral for a given starting price.
     */
    function requiredCollateral(uint256 _startingPrice) external pure returns (uint256) {
        uint256 calcCollateral = (_startingPrice * COLLATERAL_BPS) / 10000;
        return calcCollateral > MIN_COLLATERAL ? calcCollateral : MIN_COLLATERAL;
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
    
    /**
     * @notice Admin withdraws collected platform fees and forfeited bonds.
     */
    function withdrawAdminFee() external onlyAdmin {
        uint256 amount = adminFeeBalance;
        require(amount > 0, "AuctionPlatform: no fees to withdraw");
        adminFeeBalance = 0;
        (bool success, ) = admin.call{value: amount}("");
        require(success, "AuctionPlatform: admin withdrawal failed");
    }
}
