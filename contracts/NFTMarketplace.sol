// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev Marketplace para comprar y vender NFTs con soporte para ETH y ERC20
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    
    // Estructura para listings
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        bool isERC20;
        address paymentToken;
    }
    
    // Mapeo de listingId a Listing
    mapping(uint256 => Listing) public listings;
    uint256 public listingCounter;
    
    // Fee del marketplace (en basis points, 250 = 2.5%)
    uint256 public marketplaceFee = 250;
    uint256 public constant MAX_FEE = 1000; // 10% máximo
    
    // Receptor de fees
    address public feeRecipient;
    
    // Eventos
    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        bool isERC20,
        address paymentToken
    );
    
    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    constructor() {
        feeRecipient = msg.sender;
    }
    
    /**
     * @dev Listar un NFT para venta con ETH
     */
    function listNFTForETH(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not the owner"
        );
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            isActive: true,
            isERC20: false,
            paymentToken: address(0)
        });
        
        emit NFTListed(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            price,
            false,
            address(0)
        );
        
        return listingId;
    }
    
    /**
     * @dev Listar un NFT para venta con ERC20
     */
    function listNFTForERC20(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(paymentToken != address(0), "Invalid payment token");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not the owner"
        );
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            isActive: true,
            isERC20: true,
            paymentToken: paymentToken
        });
        
        emit NFTListed(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            price,
            true,
            paymentToken
        );
        
        return listingId;
    }
    
    /**
     * @dev Comprar un NFT listado con ETH
     */
    function buyNFTWithETH(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(!listing.isERC20, "Use buyNFT for ERC20 listings");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listing.isActive = false;
        
        // Calcular fee
        uint256 fee = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Transferir NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // Transferir fondos
        (bool successSeller, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(successSeller, "Seller payment failed");
        
        (bool successFee, ) = payable(feeRecipient).call{value: fee}("");
        require(successFee, "Fee payment failed");
        
        // Devolver exceso
        if (msg.value > listing.price) {
            (bool successRefund, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(successRefund, "Refund failed");
        }
        
        emit NFTSold(listingId, msg.sender, listing.seller, listing.price);
    }
    
    /**
     * @dev Comprar un NFT listado (ERC20)
     */
    function buyNFTWithERC20(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.isERC20, "Use buyNFT for ETH listings");
        
        listing.isActive = false;
        
        // Calcular fee
        uint256 fee = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Transferir tokens ERC20
        IERC20 paymentToken = IERC20(listing.paymentToken);
        require(
            paymentToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Seller payment failed"
        );
        require(
            paymentToken.transferFrom(msg.sender, feeRecipient, fee),
            "Fee payment failed"
        );
        
        // Transferir NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        emit NFTSold(listingId, msg.sender, listing.seller, listing.price);
    }
    
    /**
     * @dev Cancelar un listing
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.isActive = false;
        
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Actualizar precio de un listing
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        
        listing.price = newPrice;
        
        emit ListingUpdated(listingId, newPrice);
    }
    
    /**
     * @dev Actualizar fee del marketplace (solo owner)
     */
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        marketplaceFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Actualizar receptor de fees (solo owner)
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
    
    /**
     * @dev Obtener información de un listing
     */
    function getListing(uint256 listingId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        bool isActive,
        bool isERC20,
        address paymentToken
    ) {
        Listing memory listing = listings[listingId];
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.isActive,
            listing.isERC20,
            listing.paymentToken
        );
    }
    
    /**
     * @dev Recibir NFTs de forma segura
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
