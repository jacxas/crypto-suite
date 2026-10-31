// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiquidityPool
 * @dev Fabrica de pools de liquidez con swaps AMM y emision de recompensas.
 * @notice Implementado segun test/contracts/LiquidityPool.test.cjs.
 */
contract LiquidityPool is Ownable, ReentrancyGuard {
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SWAP_FEE_BPS = 30; // 0.3%
    uint256 public constant BPS_DENOMINATOR = 10000;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLp;
        uint256 rewardRate; // tokenA por bloque
        uint256 totalFees;
        uint256 lastRewardBlock;
        uint256 accRewardPerLp;
        bool exists;
    }

    struct UserPosition {
        uint256 lpTokens;
        uint256 rewardDebt;
    }

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => UserPosition)) public userPositions;
    uint256 public poolCount;

    event PoolCreated(uint256 indexed poolId, address indexed tokenA, address indexed tokenB, uint256 rewardRate);
    event LiquidityAdded(uint256 indexed poolId, address indexed user, uint256 amountA, uint256 amountB, uint256 lpTokens);
    event LiquidityRemoved(uint256 indexed poolId, address indexed user, uint256 amountA, uint256 amountB);
    event Swap(uint256 indexed poolId, address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event RewardsClaimed(uint256 indexed poolId, address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ==================== Pools ====================

    function createPool(address tokenA, address tokenB, uint256 rewardRate) external returns (uint256) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token");
        require(tokenA != tokenB, "Identical tokens");

        uint256 poolId = poolCount;
        poolCount++;

        Pool storage pool = pools[poolId];
        pool.tokenA = tokenA;
        pool.tokenB = tokenB;
        pool.rewardRate = rewardRate;
        pool.lastRewardBlock = block.number;
        pool.exists = true;

        emit PoolCreated(poolId, tokenA, tokenB, rewardRate);
        return poolId;
    }

    // ==================== Liquidez ====================

    function addLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 lpTokens) {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool not found");
        require(amountA > 0 && amountB > 0, "Amount must be > 0");

        _updatePool(poolId);

        require(
            IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountA),
            "Transfer A failed"
        );
        require(
            IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountB),
            "Transfer B failed"
        );

        if (pool.totalLp == 0) {
            lpTokens = _sqrt(amountA * amountB);
        } else {
            uint256 lpA = (amountA * pool.totalLp) / pool.reserveA;
            uint256 lpB = (amountB * pool.totalLp) / pool.reserveB;
            lpTokens = lpA < lpB ? lpA : lpB;
        }
        require(lpTokens > 0, "Insufficient liquidity minted");

        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLp += lpTokens;

        UserPosition storage position = userPositions[poolId][msg.sender];
        position.lpTokens += lpTokens;
        position.rewardDebt = (position.lpTokens * pool.accRewardPerLp) / PRECISION;

        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, lpTokens);
    }

    function removeLiquidity(uint256 poolId, uint256 lpTokens) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool not found");
        require(lpTokens > 0, "Amount must be > 0");

        UserPosition storage position = userPositions[poolId][msg.sender];
        require(position.lpTokens >= lpTokens, "Insufficient LP tokens");

        _updatePool(poolId);

        uint256 amountA = (lpTokens * pool.reserveA) / pool.totalLp;
        uint256 amountB = (lpTokens * pool.reserveB) / pool.totalLp;

        position.lpTokens -= lpTokens;
        position.rewardDebt = (position.lpTokens * pool.accRewardPerLp) / PRECISION;
        pool.totalLp -= lpTokens;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;

        require(IERC20(pool.tokenA).transfer(msg.sender, amountA), "Transfer A failed");
        require(IERC20(pool.tokenB).transfer(msg.sender, amountB), "Transfer B failed");

        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB);
    }

    // ==================== Swaps ====================

    function swap(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool not found");
        require(amountIn > 0, "Amount must be > 0");

        bool isA = tokenIn == pool.tokenA;
        require(isA || tokenIn == pool.tokenB, "Invalid token");

        uint256 fee = (amountIn * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;

        uint256 reserveIn = isA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isA ? pool.reserveB : pool.reserveA;

        require(reserveIn > 0 && reserveOut > 0, "Empty pool");

        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // El vendedor paga el importe completo; la comision engrosa las reservas.
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");

        address tokenOut = isA ? pool.tokenB : pool.tokenA;
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        if (isA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        pool.totalFees += fee;
        _updatePool(poolId);

        emit Swap(poolId, msg.sender, tokenIn, amountIn, amountOut);
    }

    // ==================== Recompensas ====================

    function _updatePool(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        if (pool.totalLp == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 blocksElapsed = block.number - pool.lastRewardBlock;
        if (blocksElapsed > 0) {
            uint256 accrued = blocksElapsed * pool.rewardRate;
            pool.accRewardPerLp += (accrued * PRECISION) / pool.totalLp;
            pool.lastRewardBlock = block.number;
        }
    }

    /// @notice Recompensas devengadas por un usuario (devengo bruto, sin topar).
    function pendingRewards(uint256 poolId, address user) external view returns (uint256) {
        Pool storage pool = pools[poolId];
        if (pool.totalLp == 0) return 0;

        UserPosition storage position = userPositions[poolId][user];
        uint256 acc = pool.accRewardPerLp;
        uint256 blocksElapsed = block.number - pool.lastRewardBlock;
        if (blocksElapsed > 0) {
            acc += (blocksElapsed * pool.rewardRate * PRECISION) / pool.totalLp;
        }

        uint256 gross = (position.lpTokens * acc) / PRECISION;
        if (gross <= position.rewardDebt) return 0;
        return gross - position.rewardDebt;
    }

    /// @notice Cobra las recompensas acumuladas.
    /// @dev El pago sale del excedente del pool (comisiones), nunca de las
    ///      reservas que respaldan los LP tokens.
    function claimRewards(uint256 poolId) external nonReentrant returns (uint256 paid) {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool not found");

        _updatePool(poolId);

        UserPosition storage position = userPositions[poolId][msg.sender];
        uint256 gross = (position.lpTokens * pool.accRewardPerLp) / PRECISION;
        uint256 owed = gross > position.rewardDebt ? gross - position.rewardDebt : 0;

        if (owed > 0) {
            uint256 surplus = _rewardSurplus(poolId);
            paid = owed < surplus ? owed : surplus;
            if (paid > 0) {
                require(IERC20(pool.tokenA).transfer(msg.sender, paid), "Reward transfer failed");
            }
        }

        // La parte no pagada (sin excedente suficiente) queda pendiente para
        // otra reclamacion: solo se descuenta lo que realmente se ha pagado.
        position.rewardDebt = gross - (owed - paid);

        emit RewardsClaimed(poolId, msg.sender, paid);
    }

    /// @dev tokenA disponible por encima de la reserva de liquidez.
    function _rewardSurplus(uint256 poolId) internal view returns (uint256) {
        Pool storage pool = pools[poolId];
        uint256 balance = IERC20(pool.tokenA).balanceOf(address(this));
        if (balance <= pool.reserveA) return 0;
        return balance - pool.reserveA;
    }

    // ==================== Vistas y administracion ====================

    function getReserves(uint256 poolId) external view returns (uint256 reserveA, uint256 reserveB) {
        Pool storage pool = pools[poolId];
        return (pool.reserveA, pool.reserveB);
    }

    function setRewardRate(uint256 poolId, uint256 newRate) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool not found");
        _updatePool(poolId);
        pool.rewardRate = newRate;
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
