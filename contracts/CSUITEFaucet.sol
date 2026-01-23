// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CSUITEFaucet
 * @dev Faucet con sistema de tiers, streaks, referidos y quests
 */
contract CSUITEFaucet is Ownable, ReentrancyGuard {
    IERC20 public token;
    
    // Configuración
    uint256 public baseClaimAmount = 100 * 10**18; // 100 tokens
    uint256 public claimCooldown = 24 hours;
    uint256 public streakBonusPercent = 5; // 5% por día de racha
    uint256 public maxStreakBonus = 50; // Máximo 50% bonus por racha
    uint256 public referralBonusPercent = 10; // 10% bonus por referido
    
    // Tiers
    enum Tier { Bronze, Silver, Gold, Platinum, Diamond }
    uint256[] public tierThresholds = [0, 1000 * 10**18, 5000 * 10**18, 20000 * 10**18, 50000 * 10**18];
    uint256[] public tierBonuses = [0, 25, 50, 100, 200]; // Porcentaje de bonus por tier
    
    // Estructura de usuario
    struct UserInfo {
        uint256 totalClaimed;
        uint256 lastClaimTime;
        uint256 streak;
        Tier tier;
        address referrer;
        uint256 referralCount;
        mapping(uint256 => bool) completedQuests;
    }
    
    mapping(address => UserInfo) public users;
    
    // Quests
    struct Quest {
        string name;
        uint256 reward;
        bool active;
    }
    Quest[] public quests;
    
    // Eventos
    event Claimed(address indexed user, uint256 amount, uint256 streak);
    event TierUpgraded(address indexed user, Tier newTier);
    event ReferralRegistered(address indexed user, address indexed referrer);
    event QuestCompleted(address indexed user, uint256 questId, uint256 reward);
    
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
        
        // Inicializar quests básicas
        quests.push(Quest("Primer Claim", 50 * 10**18, true));
        quests.push(Quest("Racha de 7 dias", 200 * 10**18, true));
        quests.push(Quest("Referir amigo", 100 * 10**18, true));
        quests.push(Quest("Seguir Twitter", 25 * 10**18, true));
        quests.push(Quest("Unirse Discord", 25 * 10**18, true));
        quests.push(Quest("Hacer Stake", 150 * 10**18, true));
    }
    
    /**
     * @dev Reclamar tokens
     */
    function claim() external nonReentrant {
        _claim(address(0));
    }
    
    /**
     * @dev Reclamar tokens con referido
     */
    function claimWithReferral(address referrer) external nonReentrant {
        _claim(referrer);
    }
    
    function _claim(address referrer) internal {
        UserInfo storage user = users[msg.sender];
        
        require(canClaim(msg.sender), "Cooldown activo");
        
        // Registrar referido si es primera vez
        if (user.totalClaimed == 0 && referrer != address(0) && referrer != msg.sender) {
            user.referrer = referrer;
            users[referrer].referralCount++;
            emit ReferralRegistered(msg.sender, referrer);
            
            // Quest: Referir amigo
            if (!users[referrer].completedQuests[2]) {
                _completeQuest(referrer, 2);
            }
        }
        
        // Calcular racha
        if (user.lastClaimTime > 0 && block.timestamp <= user.lastClaimTime + 48 hours) {
            user.streak++;
        } else {
            user.streak = 1;
        }
        
        // Calcular cantidad
        uint256 amount = getClaimAmount(msg.sender);
        
        // Actualizar estado
        user.lastClaimTime = block.timestamp;
        user.totalClaimed += amount;
        
        // Verificar upgrade de tier
        _checkTierUpgrade(msg.sender);
        
        // Quest: Primer Claim
        if (!user.completedQuests[0]) {
            _completeQuest(msg.sender, 0);
        }
        
        // Quest: Racha de 7 días
        if (user.streak >= 7 && !user.completedQuests[1]) {
            _completeQuest(msg.sender, 1);
        }
        
        // Transferir tokens
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        // Bonus al referidor
        if (user.referrer != address(0)) {
            uint256 referralBonus = (amount * referralBonusPercent) / 100;
            if (token.balanceOf(address(this)) >= referralBonus) {
                token.transfer(user.referrer, referralBonus);
            }
        }
        
        emit Claimed(msg.sender, amount, user.streak);
    }
    
    /**
     * @dev Verificar si puede reclamar
     */
    function canClaim(address user) public view returns (bool) {
        if (users[user].lastClaimTime == 0) return true;
        return block.timestamp >= users[user].lastClaimTime + claimCooldown;
    }
    
    /**
     * @dev Calcular cantidad a reclamar
     */
    function getClaimAmount(address user) public view returns (uint256) {
        UserInfo storage userInfo = users[user];
        
        uint256 amount = baseClaimAmount;
        
        // Bonus por tier
        amount += (amount * tierBonuses[uint256(userInfo.tier)]) / 100;
        
        // Bonus por racha (máximo 50%)
        uint256 streakBonus = userInfo.streak * streakBonusPercent;
        if (streakBonus > maxStreakBonus) streakBonus = maxStreakBonus;
        amount += (amount * streakBonus) / 100;
        
        return amount;
    }
    
    /**
     * @dev Obtener información del usuario
     */
    function getUserInfo(address user) external view returns (
        uint256 totalClaimed,
        uint256 lastClaimTime,
        uint256 streak,
        Tier tier,
        uint256 referralCount
    ) {
        UserInfo storage userInfo = users[user];
        return (
            userInfo.totalClaimed,
            userInfo.lastClaimTime,
            userInfo.streak,
            userInfo.tier,
            userInfo.referralCount
        );
    }
    
    /**
     * @dev Verificar y actualizar tier
     */
    function _checkTierUpgrade(address user) internal {
        UserInfo storage userInfo = users[user];
        
        for (uint256 i = tierThresholds.length - 1; i > uint256(userInfo.tier); i--) {
            if (userInfo.totalClaimed >= tierThresholds[i]) {
                userInfo.tier = Tier(i);
                emit TierUpgraded(user, Tier(i));
                break;
            }
        }
    }
    
    /**
     * @dev Completar quest
     */
    function _completeQuest(address user, uint256 questId) internal {
        require(questId < quests.length, "Quest no existe");
        require(quests[questId].active, "Quest inactiva");
        require(!users[user].completedQuests[questId], "Quest ya completada");
        
        users[user].completedQuests[questId] = true;
        
        uint256 reward = quests[questId].reward;
        if (token.balanceOf(address(this)) >= reward) {
            token.transfer(user, reward);
        }
        
        emit QuestCompleted(user, questId, reward);
    }
    
    /**
     * @dev Completar quest manualmente (solo owner para quests sociales)
     */
    function completeQuestForUser(address user, uint256 questId) external onlyOwner {
        _completeQuest(user, questId);
    }
    
    /**
     * @dev Verificar si quest está completada
     */
    function isQuestCompleted(address user, uint256 questId) external view returns (bool) {
        return users[user].completedQuests[questId];
    }
    
    // ============ Admin Functions ============
    
    function setBaseClaimAmount(uint256 _amount) external onlyOwner {
        baseClaimAmount = _amount;
    }
    
    function setClaimCooldown(uint256 _cooldown) external onlyOwner {
        claimCooldown = _cooldown;
    }
    
    function addQuest(string memory name, uint256 reward) external onlyOwner {
        quests.push(Quest(name, reward, true));
    }
    
    function setQuestActive(uint256 questId, bool active) external onlyOwner {
        quests[questId].active = active;
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }
    
    function fundFaucet(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
    }
}
