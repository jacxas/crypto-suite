// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseURI;

    constructor(string memory name, string memory symbol, string memory baseURI) ERC721(name, symbol) {
        _baseURI = baseURI;
    }

    function mintNFT(string memory tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(msg.sender, tokenId);
        // Note: tokenURI is not stored, assuming baseURI + tokenId
        return tokenId;
    }

    function batchMint(string[] memory tokenURIs) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            tokenIds[i] = _tokenIdCounter;
            _tokenIdCounter++;
            _mint(msg.sender, tokenIds[i]);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, Strings.toString(tokenId)));
    }
}