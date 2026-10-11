// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiContract
 * @dev Cartera multi-firma con escrow de NFTs y distribucion de tokens.
 * @notice Implementado segun test/MultiContract.test.cjs.
 */
contract MultiContract is Ownable, ReentrancyGuard {
    IERC721 public nft;
    IERC20 public token;

    /// @dev Custodia de un NFT concreto, indexada por tokenId.
    struct Escrow {
        uint256 tokenId;
        address depositor;
        address beneficiary;
        bool released;
    }

    /// @dev Propuesta de pago pendiente de firmas.
    struct Transaction {
        address to;
        uint256 amount;
        bool executed;
        uint256 signatureCount;
    }

    mapping(address => bool) public isOwner;
    address[] private _owners;

    uint256 public requiredSignatures = 1;

    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public hasSigned;

    uint256 private _transactionCount;

    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event RequiredSignaturesChanged(uint256 required);

    event NFTDeposited(uint256 indexed tokenId, address indexed depositor, address indexed beneficiary);
    event NFTReleased(uint256 indexed tokenId, address indexed beneficiary);
    event NFTRefunded(uint256 indexed tokenId, address indexed depositor);

    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 amount);
    event TransactionSigned(uint256 indexed txId, address indexed signer);
    event TransactionExecuted(uint256 indexed txId);
    event SignatureRevoked(uint256 indexed txId, address indexed signer);

    constructor(address _nft, address _token) Ownable(msg.sender) {
        nft = IERC721(_nft);
        token = IERC20(_token);

        isOwner[msg.sender] = true;
        _owners.push(msg.sender);

        // Los pagos del multi-sig salen por la via ERC-20 con allowance, que no
        // aplica la comision del 1% de `transfer` del token: asi el importe que
        // recibe el destinatario es exacto.
        IERC20(_token).approve(address(this), type(uint256).max);
    }

    // ==================== Firmantes ====================

    function addSigner(address signer) external onlyOwner {
        require(signer != address(0), "Invalid signer");
        require(!isOwner[signer], "Already a signer");

        isOwner[signer] = true;
        _owners.push(signer);

        emit SignerAdded(signer);
    }

    function removeSigner(address signer) external onlyOwner {
        require(isOwner[signer], "Not a signer");

        isOwner[signer] = false;
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == signer) {
                _owners[i] = _owners[_owners.length - 1];
                _owners.pop();
                break;
            }
        }

        emit SignerRemoved(signer);
    }

    function changeRequiredSignatures(uint256 newRequired) external onlyOwner {
        require(
            newRequired > 0 && newRequired <= _owners.length,
            "Invalid required signatures"
        );
        requiredSignatures = newRequired;
        emit RequiredSignaturesChanged(newRequired);
    }

    function getOwnerCount() external view returns (uint256) {
        return _owners.length;
    }

    function getOwners() external view returns (address[] memory) {
        return _owners;
    }

    // ==================== Escrow de NFTs ====================

    /// @notice Deposita un NFT en custodia a favor de `beneficiary`.
    function depositNFT(uint256 tokenId, address beneficiary) external nonReentrant {
        require(beneficiary != address(0), "Invalid beneficiary");

        // Revierte si quien llama no es el propietario o no ha aprobado.
        nft.transferFrom(msg.sender, address(this), tokenId);

        escrows[tokenId] = Escrow({
            tokenId: tokenId,
            depositor: msg.sender,
            beneficiary: beneficiary,
            released: false
        });

        emit NFTDeposited(tokenId, msg.sender, beneficiary);
    }

    /// @notice Entrega el NFT en custodia a su beneficiario.
    function releaseNFT(uint256 tokenId) external nonReentrant {
        Escrow storage escrow = escrows[tokenId];
        require(escrow.depositor == msg.sender, "Not depositor");
        require(!escrow.released, "Already released");

        escrow.released = true;
        nft.transferFrom(address(this), escrow.beneficiary, tokenId);

        emit NFTReleased(tokenId, escrow.beneficiary);
    }

    /// @notice Devuelve el NFT en custodia a quien lo deposito.
    function refundNFT(uint256 tokenId) external nonReentrant {
        Escrow storage escrow = escrows[tokenId];
        require(escrow.depositor == msg.sender, "Not depositor");
        require(!escrow.released, "Already released");

        escrow.released = true;
        nft.transferFrom(address(this), escrow.depositor, tokenId);

        emit NFTRefunded(tokenId, escrow.depositor);
    }

    // ==================== Multi-firma ====================

    /// @notice Propone un pago. Quien propone firma automaticamente.
    function submitTransaction(address to, uint256 amount) external returns (uint256) {
        require(isOwner[msg.sender], "Not a signer");
        require(to != address(0), "Invalid recipient");

        uint256 txId = _transactionCount;
        _transactionCount++;

        transactions[txId] = Transaction({
            to: to,
            amount: amount,
            executed: false,
            signatureCount: 1
        });
        hasSigned[txId][msg.sender] = true;

        emit TransactionSubmitted(txId, to, amount);
        return txId;
    }

    function signTransaction(uint256 txId) external {
        require(isOwner[msg.sender], "Not a signer");
        require(!transactions[txId].executed, "Already executed");
        require(!hasSigned[txId][msg.sender], "Already signed");

        hasSigned[txId][msg.sender] = true;
        transactions[txId].signatureCount += 1;

        emit TransactionSigned(txId, msg.sender);
    }

    /// @notice Retira una firma ya emitida.
    function revokeSignature(uint256 txId) external {
        require(!transactions[txId].executed, "Already executed");
        require(hasSigned[txId][msg.sender], "Not signed");

        hasSigned[txId][msg.sender] = false;
        transactions[txId].signatureCount -= 1;

        emit SignatureRevoked(txId, msg.sender);
    }

    /// @notice Ejecuta el pago cuando hay firmas suficientes.
    function executeTransaction(uint256 txId) external nonReentrant {
        require(!transactions[txId].executed, "Already executed");
        require(
            transactions[txId].signatureCount >= requiredSignatures,
            "Not enough signatures"
        );

        transactions[txId].executed = true;

        require(
            token.transferFrom(address(this), transactions[txId].to, transactions[txId].amount),
            "Payment failed"
        );

        emit TransactionExecuted(txId);
    }

    function getTransactionCount() external view returns (uint256) {
        return _transactionCount;
    }
}
