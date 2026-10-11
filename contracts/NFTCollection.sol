// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFTCollection
 * @dev ERC721 con acuñacion por lotes.
 * @notice `tokenURI` se compone siempre como baseURI + tokenId, que es lo que
 *         fijan los tests (test/NFTCollection.test.cjs).
 */
contract NFTCollection is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    event BatchMinted(uint256 count, string prefix);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /// @notice Acuña un NFT al que llama.
    /// @dev `uri` se mantiene por compatibilidad de firma: el URI final se
    ///      compone como baseURI + tokenId.
    function mintNFT(string memory uri) external onlyOwner returns (uint256) {
        uri; // parametro conservado por compatibilidad, no se almacena
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(msg.sender, tokenId);
        return tokenId;
    }

    /// @notice Acuña un NFT por cada URI de la lista.
    function batchMint(
        string[] memory tokenURIs
    ) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _mint(msg.sender, tokenId);
            tokenIds[i] = tokenId;
        }
        return tokenIds;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId)));
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
