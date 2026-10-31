// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @dev Marketplace con custodio: al publicar, el NFT pasa al contrato y se
 *      devuelve al vendedor si cancela, o al comprador si se vende.
 * @notice La especificacion (test/Integration.test.cjs) exige que mientras la
 *         publicacion este activa el propietario del NFT sea el marketplace.
 */
contract NFTMarketplace is Ownable, ReentrancyGuard {
    IERC721 public nft;
    IERC20 public token;

    struct Listing {
        uint256 tokenId;
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] public activeListings;

    event Listed(uint256 indexed tokenId, uint256 price, address seller);
    event Bought(uint256 indexed tokenId, uint256 price, address buyer, address seller);
    event Cancelled(uint256 indexed tokenId, address seller);

    constructor(address _nft, address _token) Ownable(msg.sender) {
        nft = IERC721(_nft);
        token = IERC20(_token);
    }

    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this),
            "Not approved"
        );
        require(!listings[tokenId].active, "Already listed");

        // El NFT queda en custodia del marketplace mientras dure la venta.
        nft.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing(tokenId, price, msg.sender, true);
        activeListings.push(tokenId);

        emit Listed(tokenId, price, msg.sender);
    }

    function buyNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");

        require(
            token.transferFrom(msg.sender, listing.seller, listing.price),
            "Payment failed"
        );

        listing.active = false;
        _removeActiveListing(tokenId);

        nft.transferFrom(address(this), msg.sender, tokenId);

        emit Bought(tokenId, listing.price, msg.sender, listing.seller);
    }

    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Not listed");

        listing.active = false;
        _removeActiveListing(tokenId);

        nft.transferFrom(address(this), msg.sender, tokenId);

        emit Cancelled(tokenId, msg.sender);
    }

    function getActiveListings() external view returns (Listing[] memory) {
        Listing[] memory result = new Listing[](activeListings.length);
        for (uint256 i = 0; i < activeListings.length; i++) {
            result[i] = listings[activeListings[i]];
        }
        return result;
    }

    function _removeActiveListing(uint256 tokenId) internal {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
}
