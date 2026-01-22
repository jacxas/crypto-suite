// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is Ownable {
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

    constructor(address _nft, address _token) {
        nft = IERC721(_nft);
        token = IERC20(_token);
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Not approved");
        listings[tokenId] = Listing(tokenId, price, msg.sender, true);
        activeListings.push(tokenId);
        emit Listed(tokenId, price, msg.sender);
    }

    function buyNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(token.transferFrom(msg.sender, listing.seller, listing.price), "Payment failed");
        nft.transferFrom(listing.seller, msg.sender, tokenId);
        listing.active = false;
        emit Bought(tokenId, listing.price, msg.sender, listing.seller);
        // Remove from activeListings
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not seller");
        listing.active = false;
        emit Cancelled(tokenId, msg.sender);
        // Remove from activeListings
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }

    function getActiveListings() external view returns (Listing[] memory) {
        Listing[] memory result = new Listing[](activeListings.length);
        for (uint256 i = 0; i < activeListings.length; i++) {
            result[i] = listings[activeListings[i]];
        }
        return result;
    }
}