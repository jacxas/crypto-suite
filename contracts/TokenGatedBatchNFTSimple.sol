// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenGatedBatchNFTSimple is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    struct NFTAttributes {
        uint256 power;
        uint256 level;
        uint256 tokensStaked;
        uint256 lastFeedTime;
        bool isRevealed;
        uint256 revealedTraitSeed;
    }
    
    struct ClaimTier {
        uint256 minTokens;
        uint256 maxClaims;
        uint256 cooldownPeriod;
    }
    
    IERC20 public governanceToken;
    uint256 private _tokenIdCounter;
    uint256 public revealedCount;
    uint256 public maxSupply;
    uint256 public revealBatchSize;
    uint256 public mintCost;
    string private _baseTokenURI;
    string private _unrevealedURI;
    
    mapping(uint256 => NFTAttributes) public nftAttributes;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalClaimed;
    ClaimTier[] public claimTiers;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTRevealed(uint256 indexed tokenId, uint256 traitSeed);
    event NFTFed(uint256 indexed tokenId, uint256 amount, uint256 newPower);
    event BatchRevealed(uint256 startId, uint256 endId);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address governanceToken_,
        uint256 maxSupply_,
        uint256 mintCost_,
        uint256 revealBatchSize_
    ) ERC721(name_, symbol_) {
        governanceToken = IERC20(governanceToken_);
        maxSupply = maxSupply_;
        mintCost = mintCost_;
        revealBatchSize = revealBatchSize_;
        claimTiers.push(ClaimTier(100 * 1e18, 1, 1 days));
        claimTiers.push(ClaimTier(500 * 1e18, 2, 12 hours));
        claimTiers.push(ClaimTier(1000 * 1e18, 3, 6 hours));
        claimTiers.push(ClaimTier(5000 * 1e18, 5, 3 hours));
        claimTiers.push(ClaimTier(10000 * 1e18, 10, 1 hours));
    }
    
    function mint() external nonReentrant {
        require(_tokenIdCounter < maxSupply, "Max supply");
        uint256 bal = governanceToken.balanceOf(msg.sender);
        (uint256 mc, uint256 cd) = getUserTier(bal);
        require(mc > 0, "No tier");
        require(totalClaimed[msg.sender] < mc, "Max claims");
        require(block.timestamp >= lastClaimTime[msg.sender] + cd, "Cooldown");
        if (mintCost > 0) {
            require(governanceToken.transferFrom(msg.sender, address(this), mintCost), "Pay fail");
        }
        uint256 tid = _tokenIdCounter++;
        _safeMint(msg.sender, tid);
        nftAttributes[tid] = NFTAttributes(100, 1, 0, 0, false, 0);
        lastClaimTime[msg.sender] = block.timestamp;
        totalClaimed[msg.sender]++;
        emit NFTMinted(msg.sender, tid);
    }
    
    function getUserTier(uint256 bal) public view returns (uint256, uint256) {
        for (uint256 i = claimTiers.length; i > 0; i--) {
            if (bal >= claimTiers[i-1].minTokens) {
                return (claimTiers[i-1].maxClaims, claimTiers[i-1].cooldownPeriod);
            }
        }
        return (0, 0);
    }
    
    function feedNFT(uint256 tid, uint256 amt) external nonReentrant {
        require(ownerOf(tid) == msg.sender, "Not owner");
        require(amt > 0, "Zero");
        require(governanceToken.transferFrom(msg.sender, address(this), amt), "Fail");
        NFTAttributes storage a = nftAttributes[tid];
        a.tokensStaked += amt;
        a.lastFeedTime = block.timestamp;
        a.power += amt / 1e18;
        uint256 nl = (a.power / 1000) + 1;
        if (nl > a.level) a.level = nl;
        emit NFTFed(tid, amt, a.power);
    }
    
    function batchReveal() external onlyOwner {
        uint256 ur = _tokenIdCounter - revealedCount;
        require(ur >= revealBatchSize, "Not enough");
        uint256 s = revealedCount;
        uint256 e = s + revealBatchSize;
        for (uint256 i = s; i < e; i++) {
            if (!nftAttributes[i].isRevealed) {
                uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, i)));
                nftAttributes[i].isRevealed = true;
                nftAttributes[i].revealedTraitSeed = seed;
                emit NFTRevealed(i, seed);
            }
        }
        revealedCount = e;
        emit BatchRevealed(s, e);
    }
    
    function getNFTAttributes(uint256 tid) external view returns (NFTAttributes memory) {
        return nftAttributes[tid];
    }
    
    function getClaimInfo(address u) external view returns (uint256, uint256, uint256, uint256, uint256) {
        uint256 b = governanceToken.balanceOf(u);
        (uint256 mc, uint256 cd) = getUserTier(b);
        return (b, mc, totalClaimed[u], cd, lastClaimTime[u] + cd);
    }
    
    function getTotalMinted() external view returns (uint256) { return _tokenIdCounter; }
    function setBaseURI(string memory u) external onlyOwner { _baseTokenURI = u; }
    function setUnrevealedURI(string memory u) external onlyOwner { _unrevealedURI = u; }
    function withdrawTokens(address t, uint256 a) external onlyOwner { governanceToken.transfer(t, a); }
    
    function _baseURI() internal view override returns (string memory) { return _baseTokenURI; }
    
    function tokenURI(uint256 tid) public view override returns (string memory) {
        require(_exists(tid), "Not exist");
        if (!nftAttributes[tid].isRevealed) return _unrevealedURI;
        return super.tokenURI(tid);
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
