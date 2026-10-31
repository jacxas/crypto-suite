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
    
    // Configuración base
    uint256 public baseClaimAmount = 100 * 10**18; // 100 tokens
    uint256 public claimCooldown = 24 hours;
    
    // Sistema de Tiers
    enum Tier { Bronze, Silver, Gold, Platinum, Diamond }
    
    struct TierInfo {
        uint256 multiplier; // en basis points (100 = 1x)
        uint256 requiredClaims;
        string name;
    }
    
    mapping(Tier => TierInfo) public tierInfo;
    
    // Sistema de Streaks
    uint256 public streakBonus = 5; // 5% extra por día consecutivo
    uint256 public maxStreakBonus = 50; // máximo 50% extra
    
    // Sistema de Referidos
    uint256 public referralBonus = 10; // 10% del claim del referido
    
    // Datos de usuario
    struct UserData {
        uint256 lastClaimTime;
        uint256 totalClaims;
        uint256 currentStreak;
        uint256 longestStreak;
        address referrer;
        uint256 referralCount;
        uint256 referralEarnings;
        Tier currentTier;
        mapping(uint256 => bool) completedQuests;
    }
    
    mapping(address => UserData) public userData;
    
    // Quests
    struct Quest {
        string name;
        string description;
        uint256 reward;
        bool active;
    }
    
    Quest[] public quests;
    
    // Eventos
    event TokensClaimed(address indexed user, uint256 amount, uint256 streak, Tier tier);
    event ReferralBonus(address indexed referrer, address indexed referee, uint256 amount);
    event TierUpgrade(address indexed user, Tier oldTier, Tier newTier);
    event QuestCompleted(address indexed user, uint256 questId, uint256 reward);
    event QuestAdded(uint256 questId, string name, uint256 reward);
    
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
        
        // Inicializar tiers
        tierInfo[Tier.Bronze] = TierInfo(100, 0, "Bronze");
        tierInfo[Tier.Silver] = TierInfo(125, 10, "Silver");
        tierInfo[Tier.Gold] = TierInfo(150, 50, "Gold");
        tierInfo[Tier.Platinum] = TierInfo(200, 100, "Platinum");
        tierInfo[Tier.Diamond] = TierInfo(300, 500, "Diamond");
        
        // Inicializar quests básicas
        _addQuest("First Claim", "Make your first claim", 50 * 10**18);
        _addQuest("Streak Master", "Reach a 7-day streak", 200 * 10**18);
        _addQuest("Referral King", "Refer 5 users", 500 * 10**18);
        _addQuest("Silver Status", "Reach Silver tier", 100 * 10**18);
        _addQuest("Gold Status", "Reach Gold tier", 250 * 10**18);
        _addQuest("Platinum Status", "Reach Platinum tier", 500 * 10**18);
        _addQuest("Diamond Status", "Reach Diamond tier", 1000 * 10**18);
        _addQuest("Streak Legend", "Reach a 30-day streak", 1000 * 10**18);
        _addQuest("Community Builder", "Refer 20 users", 2000 * 10**18);
        _addQuest("Veteran", "Make 100 claims", 500 * 10**18);
    }
    
    function _addQuest(string memory _name, string memory _description, uint256 _reward) internal {
        quests.push(Quest(_name, _description, _reward, true));
        emit QuestAdded(quests.length - 1, _name, _reward);
    }
    
    function claim(address _referrer) external nonReentrant {
        UserData storage user = userData[msg.sender];
        
        require(
            block.timestamp >= user.lastClaimTime + claimCooldown,
            "Cooldown not finished"
        );
        
        // Configurar referrer si es primera vez
        if (user.referrer == address(0) && _referrer != address(0) && _referrer != msg.sender) {
            user.referrer = _referrer;
            userData[_referrer].referralCount++;
        }
        
        // Calcular streak
        if (block.timestamp <= user.lastClaimTime + claimCooldown + 12 hours) {
            user.currentStreak++;
        } else {
            user.currentStreak = 1;
        }
        
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }
        
        // Calcular cantidad con bonuses
        uint256 amount = calculateClaimAmount(msg.sender);
        
        // Actualizar datos
        user.lastClaimTime = block.timestamp;
        user.totalClaims++;
        
        // Verificar upgrade de tier
        _checkTierUpgrade(msg.sender);
        
        // Transferir tokens
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        emit TokensClaimed(msg.sender, amount, user.currentStreak, user.currentTier);
        
        // Bonus de referido
        if (user.referrer != address(0)) {
            uint256 refBonus = (amount * referralBonus) / 100;
            if (token.balanceOf(address(this)) >= refBonus) {
                token.transfer(user.referrer, refBonus);
                userData[user.referrer].referralEarnings += refBonus;
                emit ReferralBonus(user.referrer, msg.sender, refBonus);
            }
        }
        
        // Auto-completar quests
        _checkQuests(msg.sender);
    }
    
    function calculateClaimAmount(address _user) public view returns (uint256) {
        UserData storage user = userData[_user];
        
        // Base amount
        uint256 amount = baseClaimAmount;
        
        // Tier multiplier
        amount = (amount * tierInfo[user.currentTier].multiplier) / 100;
        
        // Streak bonus
        uint256 streakBonusPercent = user.currentStreak * streakBonus;
        if (streakBonusPercent > maxStreakBonus) {
            streakBonusPercent = maxStreakBonus;
        }
        amount = amount + (amount * streakBonusPercent) / 100;
        
        return amount;
    }
    
    function _checkTierUpgrade(address _user) internal {
        UserData storage user = userData[_user];
        Tier oldTier = user.currentTier;
        
        if (user.totalClaims >= tierInfo[Tier.Diamond].requiredClaims) {
            user.currentTier = Tier.Diamond;
        } else if (user.totalClaims >= tierInfo[Tier.Platinum].requiredClaims) {
            user.currentTier = Tier.Platinum;
        } else if (user.totalClaims >= tierInfo[Tier.Gold].requiredClaims) {
            user.currentTier = Tier.Gold;
        } else if (user.totalClaims >= tierInfo[Tier.Silver].requiredClaims) {
            user.currentTier = Tier.Silver;
        }
        
        if (user.currentTier != oldTier) {
            emit TierUpgrade(_user, oldTier, user.currentTier);
        }
    }
    
    function _checkQuests(address _user) internal {
        UserData storage user = userData[_user];
        
        // Quest 0: First Claim
        if (!user.completedQuests[0] && user.totalClaims >= 1) {
            _completeQuest(_user, 0);
        }
        
        // Quest 1: 7-day streak
        if (!user.completedQuests[1] && user.longestStreak >= 7) {
            _completeQuest(_user, 1);
        }
        
        // Quest 2: 5 referrals
        if (!user.completedQuests[2] && user.referralCount >= 5) {
            _completeQuest(_user, 2);
        }
        
        // Quest 3-6: Tier quests
        if (!user.completedQuests[3] && user.currentTier >= Tier.Silver) {
            _completeQuest(_user, 3);
        }
        if (!user.completedQuests[4] && user.currentTier >= Tier.Gold) {
            _completeQuest(_user, 4);
        }
        if (!user.completedQuests[5] && user.currentTier >= Tier.Platinum) {
            _completeQuest(_user, 5);
        }
        if (!user.completedQuests[6] && user.currentTier >= Tier.Diamond) {
            _completeQuest(_user, 6);
        }
        
        // Quest 7: 30-day streak
        if (!user.completedQuests[7] && user.longestStreak >= 30) {
            _completeQuest(_user, 7);
        }
        
        // Quest 8: 20 referrals
        if (!user.completedQuests[8] && user.referralCount >= 20) {
            _completeQuest(_user, 8);
        }
        
        // Quest 9: 100 claims
        if (!user.completedQuests[9] && user.totalClaims >= 100) {
            _completeQuest(_user, 9);
        }
    }
    
    function _completeQuest(address _user, uint256 _questId) internal {
        UserData storage user = userData[_user];
        Quest storage quest = quests[_questId];
        
        if (!quest.active || user.completedQuests[_questId]) return;
        
        user.completedQuests[_questId] = true;
        
        if (token.balanceOf(address(this)) >= quest.reward) {
            token.transfer(_user, quest.reward);
            emit QuestCompleted(_user, _questId, quest.reward);
        }
    }
    
    // View functions
    function getUserData(address _user) external view returns (
        uint256 lastClaimTime,
        uint256 totalClaims,
        uint256 currentStreak,
        uint256 longestStreak,
        address referrer,
        uint256 referralCount,
        uint256 referralEarnings,
        Tier currentTier,
        uint256 nextClaimTime
    ) {
        UserData storage user = userData[_user];
        return (
            user.lastClaimTime,
            user.totalClaims,
            user.currentStreak,
            user.longestStreak,
            user.referrer,
            user.referralCount,
            user.referralEarnings,
            user.currentTier,
            user.lastClaimTime + claimCooldown
        );
    }
    
    function getQuestStatus(address _user, uint256 _questId) external view returns (bool) {
        return userData[_user].completedQuests[_questId];
    }
    
    function getQuestsCount() external view returns (uint256) {
        return quests.length;
    }
    
    function canClaim(address _user) external view returns (bool) {
        return block.timestamp >= userData[_user].lastClaimTime + claimCooldown;
    }
    
    function timeUntilNextClaim(address _user) external view returns (uint256) {
        uint256 nextClaim = userData[_user].lastClaimTime + claimCooldown;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }
    
    // Admin functions
    function setBaseClaimAmount(uint256 _amount) external onlyOwner {
        baseClaimAmount = _amount;
    }
    
    function setClaimCooldown(uint256 _cooldown) external onlyOwner {
        claimCooldown = _cooldown;
    }
    
    function setStreakBonus(uint256 _bonus, uint256 _maxBonus) external onlyOwner {
        streakBonus = _bonus;
        maxStreakBonus = _maxBonus;
    }
    
    function setReferralBonus(uint256 _bonus) external onlyOwner {
        referralBonus = _bonus;
    }
    
    function addQuest(string memory _name, string memory _description, uint256 _reward) external onlyOwner {
        _addQuest(_name, _description, _reward);
    }
    
    function setQuestActive(uint256 _questId, bool _active) external onlyOwner {
        quests[_questId].active = _active;
    }
    
    function withdrawTokens(uint256 _amount) external onlyOwner {
        token.transfer(owner(), _amount);
    }
    
    function fundFaucet(uint256 _amount) external {
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }
}
