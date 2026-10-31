// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Bridge
 * @dev Cross-chain bridge for tokens and NFTs with validator signatures
 */
contract Bridge is ReentrancyGuard, Pausable, AccessControl {
    using ECDSA for bytes32;
using MessageHashUtils for bytes32;
    
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Supported chains
    struct ChainInfo {
        bool isSupported;
        string name;
        uint256 minConfirmations;
    }
    
    // Bridge request
    struct BridgeRequest {
        address sender;
        address token;
        uint256 amount;
        uint256 tokenId; // For NFTs
        uint256 sourceChain;
        uint256 destChain;
        uint256 nonce;
        uint256 timestamp;
        bool isNFT;
        bool processed;
    }
    
    // Wrapped token info
    struct WrappedToken {
        address originalToken;
        uint256 originalChain;
        bool exists;
    }
    
    // Configuration
    uint256 public bridgeFee = 10; // 0.1%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minValidatorSignatures = 2;
    uint256 public requestExpiry = 24 hours;
    
    // State
    uint256 public chainId;
    uint256 public nonce;
    mapping(uint256 => ChainInfo) public supportedChains;
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(bytes32 => bool) public processedRequests;
    mapping(bytes32 => mapping(address => bool)) public validatorSignatures;
    mapping(bytes32 => uint256) public signatureCount;
    
    // Token mappings
    mapping(address => mapping(uint256 => address)) public wrappedTokens; // original => chainId => wrapped
    mapping(address => WrappedToken) public wrappedTokenInfo;
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public supportedNFTs;
    
    // Locked assets
    mapping(address => uint256) public lockedTokens;
    mapping(address => mapping(uint256 => address)) public lockedNFTs; // nft => tokenId => owner
    
    // Events
    event BridgeInitiated(
        bytes32 indexed requestId,
        address indexed sender,
        address token,
        uint256 amount,
        uint256 destChain,
        uint256 nonce
    );
    event BridgeCompleted(
        bytes32 indexed requestId,
        address indexed recipient,
        address token,
        uint256 amount
    );
    event NFTBridgeInitiated(
        bytes32 indexed requestId,
        address indexed sender,
        address nftContract,
        uint256 tokenId,
        uint256 destChain
    );
    event NFTBridgeCompleted(
        bytes32 indexed requestId,
        address indexed recipient,
        address nftContract,
        uint256 tokenId
    );
    event ValidatorSignatureAdded(bytes32 indexed requestId, address indexed validator);
    event ChainAdded(uint256 indexed chainId, string name);
    event TokenAdded(address indexed token);
    event WrappedTokenCreated(address indexed wrappedToken, address originalToken, uint256 originalChain);
    
    constructor(uint256 _chainId) {
        chainId = _chainId;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }
    
    // ============ Bridge Functions ============
    
    function bridgeTokens(
        address token,
        uint256 amount,
        uint256 destChain
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedTokens[token], "Token not supported");
        require(supportedChains[destChain].isSupported, "Chain not supported");
        require(amount > 0, "Amount must be > 0");
        
        // Calculate fee
        uint256 fee = (amount * bridgeFee) / FEE_DENOMINATOR;
        uint256 bridgeAmount = amount - fee;
        
        // Lock or burn tokens
        WrappedToken storage wrapped = wrappedTokenInfo[token];
        if (wrapped.exists) {
            // Burn wrapped tokens
            ERC20Burnable(token).burnFrom(msg.sender, amount);
        } else {
            // Lock original tokens
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            lockedTokens[token] += bridgeAmount;
        }
        
        // Create request
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            bridgeAmount,
            chainId,
            destChain,
            ++nonce,
            block.timestamp
        ));
        
        bridgeRequests[requestId] = BridgeRequest({
            sender: msg.sender,
            token: token,
            amount: bridgeAmount,
            tokenId: 0,
            sourceChain: chainId,
            destChain: destChain,
            nonce: nonce,
            timestamp: block.timestamp,
            isNFT: false,
            processed: false
        });
        
        emit BridgeInitiated(requestId, msg.sender, token, bridgeAmount, destChain, nonce);
        
        return requestId;
    }
    
    function bridgeNFT(
        address nftContract,
        uint256 tokenId,
        uint256 destChain
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedNFTs[nftContract], "NFT not supported");
        require(supportedChains[destChain].isSupported, "Chain not supported");
        
        // Lock NFT
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        lockedNFTs[nftContract][tokenId] = msg.sender;
        
        // Create request
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            nftContract,
            tokenId,
            chainId,
            destChain,
            ++nonce,
            block.timestamp
        ));
        
        bridgeRequests[requestId] = BridgeRequest({
            sender: msg.sender,
            token: nftContract,
            amount: 0,
            tokenId: tokenId,
            sourceChain: chainId,
            destChain: destChain,
            nonce: nonce,
            timestamp: block.timestamp,
            isNFT: true,
            processed: false
        });
        
        emit NFTBridgeInitiated(requestId, msg.sender, nftContract, tokenId, destChain);
        
        return requestId;
    }
    
    // ============ Validator Functions ============
    
    function submitSignature(
        bytes32 requestId,
        address recipient,
        address token,
        uint256 amount,
        uint256 sourceChain,
        bytes memory signature
    ) external onlyRole(VALIDATOR_ROLE) {
        require(!processedRequests[requestId], "Already processed");
        require(!validatorSignatures[requestId][msg.sender], "Already signed");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            requestId,
            recipient,
            token,
            amount,
            sourceChain,
            chainId
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(hasRole(VALIDATOR_ROLE, signer), "Invalid signature");
        
        validatorSignatures[requestId][msg.sender] = true;
        signatureCount[requestId]++;
        
        emit ValidatorSignatureAdded(requestId, msg.sender);
        
        // Process if enough signatures
        if (signatureCount[requestId] >= minValidatorSignatures) {
            _processTokenBridge(requestId, recipient, token, amount, sourceChain);
        }
    }
    
    function submitNFTSignature(
        bytes32 requestId,
        address recipient,
        address nftContract,
        uint256 tokenId,
        uint256 sourceChain,
        bytes memory signature
    ) external onlyRole(VALIDATOR_ROLE) {
        require(!processedRequests[requestId], "Already processed");
        require(!validatorSignatures[requestId][msg.sender], "Already signed");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            requestId,
            recipient,
            nftContract,
            tokenId,
            sourceChain,
            chainId
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(hasRole(VALIDATOR_ROLE, signer), "Invalid signature");
        
        validatorSignatures[requestId][msg.sender] = true;
        signatureCount[requestId]++;
        
        emit ValidatorSignatureAdded(requestId, msg.sender);
        
        // Process if enough signatures
        if (signatureCount[requestId] >= minValidatorSignatures) {
            _processNFTBridge(requestId, recipient, nftContract, tokenId, sourceChain);
        }
    }
    
    function _processTokenBridge(
        bytes32 requestId,
        address recipient,
        address token,
        uint256 amount,
        uint256 sourceChain
    ) internal {
        processedRequests[requestId] = true;
        
        // Check if we have wrapped token for this
        address wrappedToken = wrappedTokens[token][sourceChain];
        
        if (wrappedToken != address(0)) {
            // Mint wrapped tokens
            // Note: Wrapped token contract needs mint function
            // IMintable(wrappedToken).mint(recipient, amount);
        } else if (lockedTokens[token] >= amount) {
            // Release locked tokens
            lockedTokens[token] -= amount;
            IERC20(token).transfer(recipient, amount);
        }
        
        emit BridgeCompleted(requestId, recipient, token, amount);
    }
    
    function _processNFTBridge(
        bytes32 requestId,
        address recipient,
        address nftContract,
        uint256 tokenId,
        uint256 sourceChain
    ) internal {
        processedRequests[requestId] = true;
        
        // Release locked NFT or mint wrapped
        if (lockedNFTs[nftContract][tokenId] != address(0)) {
            delete lockedNFTs[nftContract][tokenId];
            IERC721(nftContract).transferFrom(address(this), recipient, tokenId);
        }
        
        emit NFTBridgeCompleted(requestId, recipient, nftContract, tokenId);
    }
    
    // ============ Admin Functions ============
    
    function addChain(uint256 _chainId, string memory name, uint256 minConfirmations) external onlyRole(ADMIN_ROLE) {
        supportedChains[_chainId] = ChainInfo({
            isSupported: true,
            name: name,
            minConfirmations: minConfirmations
        });
        
        emit ChainAdded(_chainId, name);
    }
    
    function addSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }
    
    function addSupportedNFT(address nftContract) external onlyRole(ADMIN_ROLE) {
        supportedNFTs[nftContract] = true;
    }
    
    function setWrappedToken(
        address originalToken,
        uint256 originalChain,
        address wrappedToken
    ) external onlyRole(ADMIN_ROLE) {
        wrappedTokens[originalToken][originalChain] = wrappedToken;
        wrappedTokenInfo[wrappedToken] = WrappedToken({
            originalToken: originalToken,
            originalChain: originalChain,
            exists: true
        });
        
        emit WrappedTokenCreated(wrappedToken, originalToken, originalChain);
    }
    
    function setBridgeFee(uint256 _bridgeFee) external onlyRole(ADMIN_ROLE) {
        require(_bridgeFee <= 500, "Fee too high"); // Max 5%
        bridgeFee = _bridgeFee;
    }
    
    function setMinValidatorSignatures(uint256 _minSignatures) external onlyRole(ADMIN_ROLE) {
        require(_minSignatures > 0, "Must be > 0");
        minValidatorSignatures = _minSignatures;
    }
    
    function addValidator(address validator) external onlyRole(ADMIN_ROLE) {
        grantRole(VALIDATOR_ROLE, validator);
    }
    
    function removeValidator(address validator) external onlyRole(ADMIN_ROLE) {
        revokeRole(VALIDATOR_ROLE, validator);
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function withdrawFees(address token) external onlyRole(ADMIN_ROLE) {
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 locked = lockedTokens[token];
        require(balance > locked, "No fees to withdraw");
        IERC20(token).transfer(msg.sender, balance - locked);
    }
    
    // ============ View Functions ============
    
    function getRequest(bytes32 requestId) external view returns (BridgeRequest memory) {
        return bridgeRequests[requestId];
    }
    
    function isRequestProcessed(bytes32 requestId) external view returns (bool) {
        return processedRequests[requestId];
    }
    
    function getSignatureCount(bytes32 requestId) external view returns (uint256) {
        return signatureCount[requestId];
    }
    
    function hasValidatorSigned(bytes32 requestId, address validator) external view returns (bool) {
        return validatorSignatures[requestId][validator];
    }
}
