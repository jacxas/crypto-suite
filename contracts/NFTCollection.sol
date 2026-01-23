// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTCollection
 * @dev Colección de NFTs con las siguientes características:
 *      - Minting público con precio en ETH
 *      - Max supply configurable
 *      - Base URI para metadata
 *      - Enumeración de tokens
 *      - Withdraw de fondos
 */
contract NFTCollection is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    string private _baseTokenURI;
    uint256 public mintPrice;
    uint256 public maxSupply;
    
    // Eventos
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor
     * @param name Nombre de la colección
     * @param symbol Símbolo de la colección
     * @param baseURI URI base para metadata
     * @param _mintPrice Precio de mint en wei
     * @param _maxSupply Supply máximo de NFTs
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 _mintPrice,
        uint256 _maxSupply
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
    }
    
    /**
     * @dev Mintea NFTs
     * @param quantity Cantidad de NFTs a mintear
     */
    function mint(uint256 quantity) public payable {
        require(quantity > 0, "Quantity must be greater than 0");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        require(_tokenIdCounter.current() + quantity <= maxSupply, "Max supply reached");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            emit NFTMinted(msg.sender, tokenId);
        }
    }
    
    /**
     * @dev Actualiza la URI base (solo owner)
     * @param newBaseURI Nueva URI base
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    /**
     * @dev Actualiza el precio de mint (solo owner)
     * @param newPrice Nuevo precio en wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }
    
    /**
     * @dev Actualiza el max supply (solo owner)
     * @param newMaxSupply Nuevo max supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= _tokenIdCounter.current(), "Cannot set below current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }
    
    /**
     * @dev Retira los fondos del contrato (solo owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Retorna la URI base
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Retorna el total de NFTs minteados
     */
    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Overrides requeridos por Solidity
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
