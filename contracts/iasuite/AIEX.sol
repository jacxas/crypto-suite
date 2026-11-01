// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIEX - AI Exchange Token
 * @notice Token de intercambio interno del ecosistema
 * @dev Facilita el swap entre los diferentes tokens de la suite
 */
contract AIEX is ERC20, Ownable {
    uint256 private constant MAX_SUPPLY = 150_000_000 * 10**18; // 150 millones
    address public iaHub;
    
    struct SwapPair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 fee; // Fee en basis points (100 = 1%)
        bool active;
    }
    
    mapping(bytes32 => SwapPair) public swapPairs;
    mapping(address => uint256) public swapVolume;
    uint256 public totalSwapVolume;
    uint256 public defaultFee = 30; // 0.3%

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event SwapPairCreated(address indexed tokenA, address indexed tokenB);
    event TokensSwapped(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
    event IAHubUpdated(address indexed oldHub, address indexed newHub);

    /**
     * @notice Constructor del token AIEX
     * @param initialSupply Suministro inicial del token
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(uint256 initialSupply, address initialOwner) ERC20("AI Exchange", "AIEX") Ownable(initialOwner) {
        require(initialSupply <= MAX_SUPPLY, "Supply exceeds maximum");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Establece la dirección del IAHub
     * @param _iaHub Nueva dirección del hub central
     */
    function setIAHub(address _iaHub) external onlyOwner {
        require(_iaHub != address(0), "Invalid IAHub address");
        address oldHub = iaHub;
        iaHub = _iaHub;
        emit IAHubUpdated(oldHub, _iaHub);
    }

    /**
     * @notice Crea un par de intercambio
     * @param tokenA Dirección del token A
     * @param tokenB Dirección del token B
     * @param fee Fee en basis points
     */
    function createSwapPair(address tokenA, address tokenB, uint256 fee) external onlyOwner {
        require(tokenA != tokenB, "Same token");
        bytes32 pairId = keccak256(abi.encodePacked(tokenA, tokenB));
        swapPairs[pairId] = SwapPair({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            fee: fee,
            active: true
        });
        emit SwapPairCreated(tokenA, tokenB);
    }

    /**
     * @notice Añade liquidez a un par
     * @param tokenA Dirección del token A
     * @param tokenB Dirección del token B
     * @param amountA Cantidad de token A
     * @param amountB Cantidad de token B
     */
    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external {
        bytes32 pairId = keccak256(abi.encodePacked(tokenA, tokenB));
        SwapPair storage pair = swapPairs[pairId];
        require(pair.active, "Pair not active");
        
        pair.reserveA += amountA;
        pair.reserveB += amountB;
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB);
    }

    /**
     * @notice Realiza un swap de tokens
     * @param tokenIn Dirección del token de entrada
     * @param tokenOut Dirección del token de salida
     * @param amountIn Cantidad de entrada
     * @return amountOut Cantidad de salida
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) external returns (uint256 amountOut) {
        bytes32 pairId = keccak256(abi.encodePacked(tokenIn, tokenOut));
        SwapPair storage pair = swapPairs[pairId];
        require(pair.active, "Pair not active");
        require(amountIn > 0, "Invalid amountIn");
        require(amountOutMin > 0, "Invalid amountOutMin");
        
        uint256 fee = (amountIn * pair.fee) / 10000;
        uint256 amountInWithFee = amountIn - fee;
        
        if (pair.tokenA == tokenIn) {
            amountOut = (amountInWithFee * pair.reserveB) / (pair.reserveA + amountInWithFee);
            pair.reserveA += amountIn;
            pair.reserveB -= amountOut;
        } else {
            amountOut = (amountInWithFee * pair.reserveA) / (pair.reserveB + amountInWithFee);
            pair.reserveB += amountIn;
            pair.reserveA -= amountOut;
        }
        
        require(amountOut >= amountOutMin, "Slippage exceeded");
        
        swapVolume[msg.sender] += amountIn;
        totalSwapVolume += amountIn;
        emit TokensSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    /**
     * @notice Obtiene el precio de un par
     * @param tokenA Dirección del token A
     * @param tokenB Dirección del token B
     * @return price Precio del par
     */
    function getPairPrice(address tokenA, address tokenB) external view returns (uint256 price) {
        bytes32 pairId = keccak256(abi.encodePacked(tokenA, tokenB));
        SwapPair storage pair = swapPairs[pairId];
        if (pair.reserveA > 0) {
            price = (pair.reserveB * 1e18) / pair.reserveA;
        }
        return price;
    }

    /**
     * @notice Mint de nuevos tokens
     * @param to Dirección receptora
     * @param amount Cantidad a mintear
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Quema tokens
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /**
     * @notice Quema tokens de una dirección específica
     * @param from Dirección de origen
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == owner() || msg.sender == iaHub, "Not authorized");
        _burn(from, amount);
        emit Burned(from, amount);
    }

    /**
     * @notice Obtiene el suministro máximo
     * @return uint256 Suministro máximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
