// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTAuction
 * @dev NFT Auction contract supporting English and Dutch auctions with royalties
 */
contract NFTAuction is ReentrancyGuard, Pausable, Ownable {
    // Auction types
    enum AuctionType { English, Dutch }
    enum AuctionState { Active, Ended, Canceled }
    
    // Auction structure
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        address paymentToken; // address(0) for ETH
        AuctionType auctionType;
        uint256 startPrice;
        uint256 endPrice; // For Dutch auctions
        uint256 reservePrice; // Minimum price for English auctions
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool ended;
        bool canceled;
    }
    
    // Bid structure
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Offer structure (for direct offers on any NFT)
    struct Offer {
        address offerer;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 amount;
        uint256 expirationTime;
        bool accepted;
        bool canceled;
    }
    
    // Configuration
    uint256 public platformFee = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minAuctionDuration = 1 hours;
    uint256 public maxAuctionDuration = 30 days;
    uint256 public minBidIncrement = 100; // 1%
    
    // State
    uint256 public auctionCount;
    uint256 public offerCount;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(uint256 => Offer) public offers;
    mapping(address => mapping(uint256 => uint256)) public nftToAuction; // nft => tokenId => auctionId
    
    // Royalties
    mapping(address => address) public royaltyRecipient;
    mapping(address => uint256) public royaltyPercentage;
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        AuctionType auctionType,
        uint256 startPrice,
        uint256 endTime
    );
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);
    event AuctionCanceled(uint256 indexed auctionId);
    event OfferCreated(uint256 indexed offerId, address indexed offerer, address nftContract, uint256 tokenId, uint256 amount);
    event OfferAccepted(uint256 indexed offerId);
    event OfferCanceled(uint256 indexed offerId);
    event RoyaltySet(address indexed nftContract, address recipient, uint256 percentage);
    
    // ============ Auction Functions ============
    
    function createEnglishAuction(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(duration >= minAuctionDuration && duration <= maxAuctionDuration, "Invalid duration");
        require(startPrice > 0, "Start price must be > 0");
        
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        uint256 auctionId = ++auctionCount;
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            paymentToken: paymentToken,
            auctionType: AuctionType.English,
            startPrice: startPrice,
            endPrice: 0,
            reservePrice: reservePrice,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            ended: false,
            canceled: false
        });
        
        nftToAuction[nftContract][tokenId] = auctionId;
        
        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, AuctionType.English, startPrice, block.timestamp + duration);
        
        return auctionId;
    }
    
    function createDutchAuction(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(duration >= minAuctionDuration && duration <= maxAuctionDuration, "Invalid duration");
        require(startPrice > endPrice, "Start price must be > end price");
        require(endPrice > 0, "End price must be > 0");
        
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        uint256 auctionId = ++auctionCount;
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            paymentToken: paymentToken,
            auctionType: AuctionType.Dutch,
            startPrice: startPrice,
            endPrice: endPrice,
            reservePrice: endPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            ended: false,
            canceled: false
        });
        
        nftToAuction[nftContract][tokenId] = auctionId;
        
        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, AuctionType.Dutch, startPrice, block.timestamp + duration);
        
        return auctionId;
    }
    
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(auction.auctionType == AuctionType.English, "Not English auction");
        require(auction.paymentToken == address(0), "Use placeBidWithToken");
        
        uint256 minBid = auction.highestBid == 0 
            ? auction.startPrice 
            : auction.highestBid + (auction.highestBid * minBidIncrement) / FEE_DENOMINATOR;
        
        require(msg.value >= minBid, "Bid too low");
        
        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }
    
    function placeBidWithToken(uint256 auctionId, uint256 amount) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(auction.auctionType == AuctionType.English, "Not English auction");
        require(auction.paymentToken != address(0), "Use placeBid for ETH");
        
        uint256 minBid = auction.highestBid == 0 
            ? auction.startPrice 
            : auction.highestBid + (auction.highestBid * minBidIncrement) / FEE_DENOMINATOR;
        
        require(amount >= minBid, "Bid too low");
        
        IERC20 token = IERC20(auction.paymentToken);
        
        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            token.transfer(auction.highestBidder, auction.highestBid);
        }
        
        token.transferFrom(msg.sender, address(this), amount);
        
        auction.highestBid = amount;
        auction.highestBidder = msg.sender;
        
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));
        
        emit BidPlaced(auctionId, msg.sender, amount);
    }
    
    function buyDutchAuction(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(auction.auctionType == AuctionType.Dutch, "Not Dutch auction");
        
        uint256 currentPrice = getDutchAuctionPrice(auctionId);
        
        if (auction.paymentToken == address(0)) {
            require(msg.value >= currentPrice, "Insufficient payment");
            if (msg.value > currentPrice) {
                payable(msg.sender).transfer(msg.value - currentPrice);
            }
        } else {
            IERC20(auction.paymentToken).transferFrom(msg.sender, address(this), currentPrice);
        }
        
        auction.highestBid = currentPrice;
        auction.highestBidder = msg.sender;
        auction.ended = true;
        
        _finalizeAuction(auctionId);
    }
    
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended yet");
        
        auction.ended = true;
        
        if (auction.highestBidder != address(0) && auction.highestBid >= auction.reservePrice) {
            _finalizeAuction(auctionId);
        } else {
            // Return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            
            // Refund highest bidder if any
            if (auction.highestBidder != address(0)) {
                if (auction.paymentToken == address(0)) {
                    payable(auction.highestBidder).transfer(auction.highestBid);
                } else {
                    IERC20(auction.paymentToken).transfer(auction.highestBidder, auction.highestBid);
                }
            }
        }
        
        emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
    }
    
    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.seller, "Not seller");
        require(!auction.ended && !auction.canceled, "Auction not active");
        require(auction.highestBidder == address(0), "Has bids");
        
        auction.canceled = true;
        
        IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
        
        emit AuctionCanceled(auctionId);
    }
    
    function _finalizeAuction(uint256 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        
        uint256 totalAmount = auction.highestBid;
        uint256 platformFeeAmount = (totalAmount * platformFee) / FEE_DENOMINATOR;
        uint256 royaltyAmount = 0;
        
        // Calculate royalty
        address royaltyRecip = royaltyRecipient[auction.nftContract];
        if (royaltyRecip != address(0)) {
            royaltyAmount = (totalAmount * royaltyPercentage[auction.nftContract]) / FEE_DENOMINATOR;
        }
        
        uint256 sellerAmount = totalAmount - platformFeeAmount - royaltyAmount;
        
        // Transfer payments
        if (auction.paymentToken == address(0)) {
            payable(auction.seller).transfer(sellerAmount);
            if (royaltyAmount > 0) {
                payable(royaltyRecip).transfer(royaltyAmount);
            }
        } else {
            IERC20 token = IERC20(auction.paymentToken);
            token.transfer(auction.seller, sellerAmount);
            if (royaltyAmount > 0) {
                token.transfer(royaltyRecip, royaltyAmount);
            }
        }
        
        // Transfer NFT
        IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
        
        emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
    }
    
    // ============ Offer Functions ============
    
    function createOffer(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 amount,
        uint256 duration
    ) external payable nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        if (paymentToken == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            IERC20(paymentToken).transferFrom(msg.sender, address(this), amount);
        }
        
        uint256 offerId = ++offerCount;
        offers[offerId] = Offer({
            offerer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            paymentToken: paymentToken,
            amount: amount,
            expirationTime: block.timestamp + duration,
            accepted: false,
            canceled: false
        });
        
        emit OfferCreated(offerId, msg.sender, nftContract, tokenId, amount);
        
        return offerId;
    }
    
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(!offer.accepted && !offer.canceled, "Offer not active");
        require(block.timestamp < offer.expirationTime, "Offer expired");
        require(IERC721(offer.nftContract).ownerOf(offer.tokenId) == msg.sender, "Not NFT owner");
        
        offer.accepted = true;
        
        // Transfer NFT
        IERC721(offer.nftContract).transferFrom(msg.sender, offer.offerer, offer.tokenId);
        
        // Calculate fees
        uint256 platformFeeAmount = (offer.amount * platformFee) / FEE_DENOMINATOR;
        uint256 royaltyAmount = 0;
        
        address royaltyRecip = royaltyRecipient[offer.nftContract];
        if (royaltyRecip != address(0)) {
            royaltyAmount = (offer.amount * royaltyPercentage[offer.nftContract]) / FEE_DENOMINATOR;
        }
        
        uint256 sellerAmount = offer.amount - platformFeeAmount - royaltyAmount;
        
        // Transfer payment
        if (offer.paymentToken == address(0)) {
            payable(msg.sender).transfer(sellerAmount);
            if (royaltyAmount > 0) {
                payable(royaltyRecip).transfer(royaltyAmount);
            }
        } else {
            IERC20 token = IERC20(offer.paymentToken);
            token.transfer(msg.sender, sellerAmount);
            if (royaltyAmount > 0) {
                token.transfer(royaltyRecip, royaltyAmount);
            }
        }
        
        emit OfferAccepted(offerId);
    }
    
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(msg.sender == offer.offerer, "Not offerer");
        require(!offer.accepted && !offer.canceled, "Offer not active");
        
        offer.canceled = true;
        
        // Refund
        if (offer.paymentToken == address(0)) {
            payable(msg.sender).transfer(offer.amount);
        } else {
            IERC20(offer.paymentToken).transfer(msg.sender, offer.amount);
        }
        
        emit OfferCanceled(offerId);
    }
    
    // ============ View Functions ============
    
    function getDutchAuctionPrice(uint256 auctionId) public view returns (uint256) {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionType == AuctionType.Dutch, "Not Dutch auction");
        
        if (block.timestamp >= auction.endTime) {
            return auction.endPrice;
        }
        
        uint256 elapsed = block.timestamp - auction.startTime;
        uint256 duration = auction.endTime - auction.startTime;
        uint256 priceDrop = ((auction.startPrice - auction.endPrice) * elapsed) / duration;
        
        return auction.startPrice - priceDrop;
    }
    
    function getAuctionBids(uint256 auctionId) external view returns (Bid[] memory) {
        return auctionBids[auctionId];
    }
    
    function getAuctionState(uint256 auctionId) external view returns (AuctionState) {
        Auction storage auction = auctions[auctionId];
        if (auction.canceled) return AuctionState.Canceled;
        if (auction.ended || block.timestamp >= auction.endTime) return AuctionState.Ended;
        return AuctionState.Active;
    }
    
    // ============ Admin Functions ============
    
    function setRoyalty(address nftContract, address recipient, uint256 percentage) external {
        require(percentage <= 1000, "Royalty too high"); // Max 10%
        require(
            msg.sender == owner() || msg.sender == Ownable(nftContract).owner(),
            "Not authorized"
        );
        
        royaltyRecipient[nftContract] = recipient;
        royaltyPercentage[nftContract] = percentage;
        
        emit RoyaltySet(nftContract, recipient, percentage);
    }
    
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _platformFee;
    }
    
    function setMinBidIncrement(uint256 _minBidIncrement) external onlyOwner {
        minBidIncrement = _minBidIncrement;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function withdrawTokenFees(address token) external onlyOwner {
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    receive() external payable {}
}
