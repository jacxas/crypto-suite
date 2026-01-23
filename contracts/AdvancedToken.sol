// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdvancedToken
 * @dev Token ERC20 con funcionalidades avanzadas:
 *      - Minteo inicial configurable
 *      - Burn (quemar tokens)
 *      - Pause/Unpause (emergencias)
 *      - Control de acceso (Ownable)
 */
contract AdvancedToken is ERC20, ERC20Burnable, Pausable, Ownable {
    
    // Eventos personalizados
    event TokensBurned(address indexed burner, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor que mintea el supply inicial al deployer
     * @param name Nombre del token
     * @param symbol Símbolo del token
     * @param initialSupply Supply inicial (en wei)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply);
    }
    
    /**
     * @dev Pausa todas las transferencias de tokens
     * Solo el owner puede llamar esta función
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Reanuda las transferencias de tokens
     * Solo el owner puede llamar esta función
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Mintea nuevos tokens (solo owner)
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Override de burn para emitir evento personalizado
     * @param amount Cantidad de tokens a quemar
     */
    function burn(uint256 amount) public virtual override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Override de burnFrom para emitir evento personalizado
     * @param account Dirección de la cual quemar tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burnFrom(address account, uint256 amount) public virtual override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    /**
     * @dev Hook que se ejecuta antes de cualquier transferencia
     * Verifica que el contrato no esté pausado
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
