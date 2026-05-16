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
        Pending,    // 0: Created in DB, not yet confirmed on-chain
        Upcoming,   // 1: Confirmed on-chain, but startTime > now
        Active,     // 2: Accepting bids
        Ended,      // 3: Time expired
        Canceled,   // 4: Canceled by seller or admin
        Forfeited   // 5: Winner forfeited
    }

    enum EscrowStatus {
        None,
        AwaitingShipment, // Added: Waiting for seller to ship
        AwaitingDelivery,
        Disputed,
        Completed,
        Refunded
    }

    enum ShippingPayer {
        Buyer,
        Seller
    }

    // ── Structs ──────────────────────────────────────────────────────────────

    struct Auction {
        address payable seller;
        uint256 startingPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 startTime;            // Added: Auction start time
        uint256 endTime;
        uint256 collateral;           // Seller's locked collateral
        string productCid;            // IPFS CID from Pinata
        AuctionStatus status;
        EscrowStatus escrowStatus;
        uint256 shippedTime;          // Timestamp when item was shipped
        bytes32 shipmentProofHash;    // Proof of shipment hash
        uint256 buyNowPrice;          // Consensus C-01: 0 = disabled; if bid >= this, auction ends immediately
        uint256 deliveryDeadline;     // Consensus C-03: set by markShipped(); claimFunds() checks against this
        bool    deliveryExtensionUsed; // Consensus C-03: buyer may extend deadline once
        uint256 shippingFee;           // On-chain shipping fee decided by provider service
        ShippingPayer shippingPayer;   // Who pays for shipping
        bool    shippingFeePaid;       // For Buyer payer: has the fee been deposited?
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
    
    // Consensus C-03: Auto-release Timeout reduced to 7 days (was 14 days)
    uint256 public constant AUTO_RELEASE_TIMEOUT = 7 days;

    // Consensus C-03: 1-time delivery extension duration
    uint256 public constant DELIVERY_EXTENSION_DURATION = 7 days;

    // Consensus C-04: Winner forfeit penalty = 10% of highestBid
    uint256 public constant FORFEIT_PENALTY_BPS = 1000;

    // Consensus C-04: Platform receives 20% of forfeit penalty; seller receives 80%
    uint256 public constant FORFEIT_PLATFORM_SHARE_BPS = 2000;
    
    // Task 4: Anti-sniping
    uint256 public constant EXTENSION_WINDOW = 5 minutes;
    uint256 public constant EXTENSION_DURATION = 5 minutes;
    
    // Task 5: Dispute Bond
    uint256 public constant DISPUTE_BOND = 0.005 ether;

    // Option B (A-Questionable): Minimum delay from auction end before buyer can dispute
    // in AwaitingShipment. Gives seller 48h to ship; closes abuse path where buyer uses
    // raiseDispute() to escape forfeitWin() penalty. Buyer with genuine fraud claim waits 48h.
    uint256 public constant DISPUTE_MIN_DELAY_SHIPMENT = 2 days;
    
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

    // Consensus C-03: Buyer requested a 1-time delivery deadline extension
    event DeliveryExtensionRequested(uint256 indexed auctionId, address indexed buyer);

    // Consensus C-04: Winner forfeited their win; penalty split 80% seller / 20% platform
    event WinnerForfeited(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 penalty,
        uint256 winnerRefund
    );

    event ShippingFeeSet(uint256 indexed auctionId, uint256 fee);
    event ShippingFeePaid(uint256 indexed auctionId, address indexed buyer, uint256 amount);

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
     * @param _startTime Timestamp when auction starts
     * @param _duration Auction duration in seconds
     * @param _productCid IPFS CID of product metadata
     */
    function createAuction(
        uint256 _startingPrice,
        uint256 _startTime,
        uint256 _duration,
        string calldata _productCid,
        uint256 _buyNowPrice, // Consensus C-01: 0 = disabled; must exceed startingPrice if set
        ShippingPayer _shippingPayer
    ) external payable nonReentrant {
        require(_startingPrice > 0, "AuctionPlatform: starting price must be > 0");
        require(_startTime >= block.timestamp, "AuctionPlatform: startTime must be >= now");
        require(_duration > 0, "AuctionPlatform: duration must be > 0");
        require(bytes(_productCid).length > 0, "AuctionPlatform: product CID required");

        // Consensus C-01: buyNowPrice must be strictly greater than startingPrice if enabled
        require(
            _buyNowPrice == 0 || _buyNowPrice > _startingPrice,
            "AuctionPlatform: buyNowPrice must exceed startingPrice"
        );

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
            startTime: _startTime,
            endTime: _startTime + _duration,
            collateral: msg.value,
            productCid: _productCid,
            status: _startTime > block.timestamp ? AuctionStatus.Upcoming : AuctionStatus.Active,
            escrowStatus: EscrowStatus.None,
            shippedTime: 0,
            shipmentProofHash: bytes32(0),
            buyNowPrice: _buyNowPrice,
            deliveryDeadline: 0,
            deliveryExtensionUsed: false,
            shippingFee: 0,
            shippingPayer: _shippingPayer,
            shippingFeePaid: false
        });

        emit AuctionCreated(
            newAuctionId,
            msg.sender,
            _startingPrice,
            _startTime + _duration,
            _productCid
        );
    }

    /**
     * @notice Place a bid. Bid amount = msg.value. Must exceed current highest bid.
     * @param _auctionId Target auction
     */
    function bid(uint256 _auctionId) external payable nonReentrant auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.status == AuctionStatus.Active || auction.status == AuctionStatus.Upcoming,
            "AuctionPlatform: auction not active"
        );
        require(block.timestamp >= auction.startTime, "AuctionPlatform: auction not yet started");
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
        
        // If it was Upcoming, mark it as Active now that it has started
        if (auction.status == AuctionStatus.Upcoming) {
            auction.status = AuctionStatus.Active;
        }

        emit BidPlaced(_auctionId, msg.sender, msg.value);

        // Consensus C-01: Buy Now — if bid meets buyNowPrice, end auction immediately.
        // Seller declared this threshold at creation; all bidders knew the rule upfront.
        if (auction.buyNowPrice > 0 && msg.value >= auction.buyNowPrice) {
            auction.status = AuctionStatus.Ended;
            auction.endTime = block.timestamp;
            auction.escrowStatus = EscrowStatus.AwaitingShipment;
            emit AuctionEnded(_auctionId, msg.sender, msg.value);
        }
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

        require(
            auction.status == AuctionStatus.Active || auction.status == AuctionStatus.Upcoming,
            "AuctionPlatform: auction not active"
        );
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

        require(
            auction.status == AuctionStatus.Active || auction.status == AuctionStatus.Upcoming,
            "AuctionPlatform: auction not active"
        );
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
     * @notice Admin (or simulated Shipping Provider) sets the official shipping fee.
     */
    function setShippingFee(uint256 _auctionId, uint256 _fee) external onlyAdmin auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.shippingFee == 0, "AuctionPlatform: fee already set");
        auction.shippingFee = _fee;
        emit ShippingFeeSet(_auctionId, _fee);
    }

    /**
     * @notice Buyer pays the shipping fee if shippingPayer is Buyer.
     */
    function payShippingFee(uint256 _auctionId) external payable nonReentrant onlyWinner(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.shippingPayer == ShippingPayer.Buyer, "AuctionPlatform: seller pays shipping");
        require(!auction.shippingFeePaid, "AuctionPlatform: fee already paid");
        require(auction.shippingFee > 0, "AuctionPlatform: shipping fee not yet set");
        require(msg.value == auction.shippingFee, "AuctionPlatform: incorrect fee amount");

        auction.shippingFeePaid = true;
        emit ShippingFeePaid(_auctionId, msg.sender, msg.value);
    }

    /**
     * @notice Task 6: Seller marks the item as shipped and provides proof.
     */
    function markShipped(uint256 _auctionId, bytes32 _shipmentProofHash) external nonReentrant onlySeller(_auctionId) auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.escrowStatus == EscrowStatus.AwaitingShipment,
            "AuctionPlatform: not in AwaitingShipment state"
        );

        if (auction.shippingPayer == ShippingPayer.Buyer) {
            require(auction.shippingFeePaid, "AuctionPlatform: buyer has not paid shipping fee");
        } else {
            // If Seller pays, fee must be set so we can deduct it later
            require(auction.shippingFee > 0, "AuctionPlatform: shipping fee not yet set");
        }

        auction.escrowStatus = EscrowStatus.AwaitingDelivery;
        auction.shippedTime = block.timestamp;
        auction.shipmentProofHash = _shipmentProofHash;

        // Consensus C-03: Set explicit deadline — cleaner semantics than mutating shippedTime later
        auction.deliveryDeadline = block.timestamp + AUTO_RELEASE_TIMEOUT;

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
        uint256 platformFee = (auction.highestBid * PLATFORM_FEE_BPS) / 10000;
        adminFeeBalance += platformFee;

        uint256 payout;
        if (auction.shippingPayer == ShippingPayer.Seller) {
            // Deduct shipping fee from seller's payout
            adminFeeBalance += auction.shippingFee;
            payout = (auction.highestBid - platformFee - auction.shippingFee) + auction.collateral;
        } else {
            // Buyer already paid shipping fee to contract, add it to admin balance
            adminFeeBalance += auction.shippingFee;
            payout = (auction.highestBid - platformFee) + auction.collateral;
        }

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
        // Consensus C-03: Use deliveryDeadline instead of shippedTime + constant
        // deliveryDeadline may have been extended once by buyer via requestDeliveryExtension()
        require(
            block.timestamp >= auction.deliveryDeadline,
            "AuctionPlatform: timeout not reached"
        );

        auction.escrowStatus = EscrowStatus.Completed;

        // Task 8: Platform Fee
        uint256 platformFee = (auction.highestBid * PLATFORM_FEE_BPS) / 10000;
        adminFeeBalance += platformFee;

        uint256 payout;
        if (auction.shippingPayer == ShippingPayer.Seller) {
            // Deduct shipping fee from seller's payout
            adminFeeBalance += auction.shippingFee;
            payout = (auction.highestBid - platformFee - auction.shippingFee) + auction.collateral;
        } else {
            // Buyer already paid shipping fee to contract, add it to admin balance
            adminFeeBalance += auction.shippingFee;
            payout = (auction.highestBid - platformFee) + auction.collateral;
        }

        auction.highestBid = 0;
        auction.collateral = 0;

        (bool success, ) = auction.seller.call{value: payout}("");
        require(success, "AuctionPlatform: payout to seller failed");

        emit AutoReleaseCompleted(_auctionId);
    }

    /**
     * @notice Consensus C-03: Buyer requests a 1-time extension of delivery deadline by 7 days.
     *         Only valid while escrow is in AwaitingDelivery. Extension cannot be repeated.
     * @param _auctionId Target auction
     */
    function requestDeliveryExtension(uint256 _auctionId)
        external
        nonReentrant
        onlyWinner(_auctionId)
        auctionExists(_auctionId)
    {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.escrowStatus == EscrowStatus.AwaitingDelivery,
            "AuctionPlatform: not in AwaitingDelivery state"
        );
        require(
            !auction.deliveryExtensionUsed,
            "AuctionPlatform: extension already used"
        );

        auction.deliveryExtensionUsed = true;
        auction.deliveryDeadline += DELIVERY_EXTENSION_DURATION;

        emit DeliveryExtensionRequested(_auctionId, msg.sender);
    }

    /**
     * @notice Consensus C-04: Winner forfeits their win before seller ships.
     *         Penalty = max(10% highestBid, DISPUTE_BOND). Split: 80% → seller, 20% → platform.
     *         Once seller calls markShipped(), forfeit is blocked — buyer must use raiseDispute().
     * @param _auctionId Target auction
     */
    function forfeitWin(uint256 _auctionId)
        external
        nonReentrant
        onlyWinner(_auctionId)
        auctionExists(_auctionId)
    {
        Auction storage auction = auctions[_auctionId];

        // Only allowed before seller ships — after shipment, seller has incurred real costs
        require(
            auction.escrowStatus == EscrowStatus.AwaitingShipment,
            "AuctionPlatform: can only forfeit before shipment"
        );

        // Snapshot before zeroing to prevent reentrancy
        uint256 bidAmount  = auction.highestBid;
        uint256 collateral = auction.collateral;
        address payable winner = auction.highestBidder;
        address payable seller = auction.seller;

        auction.status       = AuctionStatus.Forfeited;
        auction.escrowStatus = EscrowStatus.Refunded;
        auction.highestBid   = 0;
        auction.collateral   = 0;

        // Penalty = max(10% bid, DISPUTE_BOND) — minimum deterrent against tiny bids
        uint256 pctPenalty = (bidAmount * FORFEIT_PENALTY_BPS) / 10000;
        uint256 penalty    = pctPenalty > DISPUTE_BOND ? pctPenalty : DISPUTE_BOND;
        require(penalty <= bidAmount, "AuctionPlatform: penalty exceeds bid");

        // Split: 20% → platform, 80% → seller
        uint256 platformShare    = (penalty * FORFEIT_PLATFORM_SHARE_BPS) / 10000;
        uint256 sellerPenaltyShare = penalty - platformShare;
        uint256 winnerRefund     = bidAmount - penalty;

        adminFeeBalance += platformShare;

        if (winnerRefund > 0) {
            (bool okW, ) = winner.call{value: winnerRefund}("");
            require(okW, "AuctionPlatform: winner refund failed");
        }

        // Seller receives their collateral back + 80% of penalty as compensation
        (bool okS, ) = seller.call{value: collateral + sellerPenaltyShare}("");
        require(okS, "AuctionPlatform: seller payout failed");

        emit WinnerForfeited(_auctionId, msg.sender, penalty, winnerRefund);
    }

    /**
     * @notice Buyer raises dispute if item not delivered or misrepresented.
     * @dev Option B (A-Questionable): In AwaitingShipment, dispute is only allowed after
     *      DISPUTE_MIN_DELAY_SHIPMENT (48h) from auction end. This closes the abuse path
     *      where a buyer calls raiseDispute() to avoid the forfeitWin() penalty.
     *      If buyer changed their mind → use forfeitWin().
     *      If seller is acting in bad faith (refuses to ship, fraud) → wait 48h then dispute.
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

        // Option B: In AwaitingShipment, enforce minimum delay to give seller time to ship
        // and to prevent buyers from using dispute as a cheaper alternative to forfeitWin().
        if (auction.escrowStatus == EscrowStatus.AwaitingShipment) {
            require(
                block.timestamp >= auction.endTime + DISPUTE_MIN_DELAY_SHIPMENT,
                "AuctionPlatform: wait for seller to ship before disputing"
            );
        }

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
     * @notice Get core auction fields: bidding state, seller, price, status.
     *         Split from getAuctionEscrow() to avoid Solidity stack-too-deep limit.
     */
    function getAuctionCore(uint256 _auctionId)
        external
        view
        auctionExists(_auctionId)
        returns (
            address seller,
            uint256 startingPrice,
            uint256 highestBid,
            address highestBidder,
            uint256 startTime,
            uint256 endTime,
            uint256 collateral,
            string memory productCid,
            AuctionStatus status,
            uint256 buyNowPrice
        )
    {
        Auction storage a = auctions[_auctionId];
        return (
            a.seller,
            a.startingPrice,
            a.highestBid,
            a.highestBidder,
            a.startTime,
            a.endTime,
            a.collateral,
            a.productCid,
            a.status,
            a.buyNowPrice
        );
    }

    /**
     * @notice Get escrow/shipment fields: escrow status, shipping proof, delivery deadline.
     *         Call alongside getAuctionCore() to get the full picture.
     */
    function getAuctionEscrow(uint256 _auctionId)
        external
        view
        auctionExists(_auctionId)
        returns (
            EscrowStatus escrowStatus,
            uint256 shippedTime,
            bytes32 shipmentProofHash,
            uint256 deliveryDeadline,
            bool deliveryExtensionUsed
        )
    {
        Auction storage a = auctions[_auctionId];
        return (
            a.escrowStatus,
            a.shippedTime,
            a.shipmentProofHash,
            a.deliveryDeadline,
            a.deliveryExtensionUsed
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
