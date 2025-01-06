// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {MachineSmartAccount} from "./MachineSmartAccount.sol";

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract GasStationFactory {
    uint256 constant MIN_BALANCE = 330000000000000000; // 0.33 tokens in 18 decimals
    uint256 constant FUNDING_AMOUNT = 500000000000000000; // 0.5 tokens in 18 decimals
    address constant PEAQ_RBAC =
        address(0x0000000000000000000000000000000000000802); // peaq RBAC contract address
    address constant PEAQ_DID =
        address(0x0000000000000000000000000000000000000800); // peaq DID contract address
    address constant PEAQ_STORAGE =
        address(0x0000000000000000000000000000000000000801); // peaq storage contract address
    address constant FUNDING_TOKEN =
        address(0x0000000000000000000000000000000000000809); // AGUNG token contract address
    address public owner; // Owner of the Gas station Factory
    address public gasStation; // Authorized relayer or gas station address that authorize all tx
    mapping(uint256 => bool) private usedNonces; // nonces used for replay protection
    event MetaTransactionExecuted(
        address indexed user,
        address indexed relayer,
        address target,
        bytes functionCall
    );
    event GasStationChanged(
        address indexed previousGasStation,
        address indexed newGasStation
    );
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event MachineSmartAccountDeployed(address indexed deployedAddress);

    error ZeroAddress();
    error NonceAlreadyUsed(uint256 nonce);
    error InvalidSignature(bytes32 messageHash, uint256 nonce);
    error TransferFailed(address token, address recipient, uint256 amount);
    error OnlyOwner(address caller);
    error OnlyGasStation(address caller);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwner(msg.sender); // Only owner can call this function
        }
        _;
    }

    modifier onlyGasStation() {
        if (msg.sender != gasStation) {
            revert OnlyGasStation(msg.sender); // Only gas station can call this function
        }
        _;
    }

    constructor(address _owner, address _gasStation) {
        if (_owner == address(0)) revert ZeroAddress(); // Owner address cannot be zero
        if (_gasStation == address(0)) revert ZeroAddress(); // Gas station address cannot be zero

        owner = _owner;
        gasStation = _gasStation;
    }

    function changeOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress(); // New owner address cannot be zero

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function changeGasStation(address newGasStation) external onlyOwner {
        if (newGasStation == address(0)) revert ZeroAddress(); // New gas station address cannot be zero

        emit GasStationChanged(gasStation, newGasStation);
        gasStation = newGasStation;
    }

    /**
     * @dev Deploy a new Machine Smart account contract via the gas station factory contract.
     * @param eoa The user (machine owner) on whose behalf the transaction is executed.
     * @param signature The signature verifying the owner's tx approval.
     */
    function deployMachineSmartAccount(
        address eoa,
        uint256 nonce,
        bytes calldata signature
    ) external returns (address) {
        if (eoa == address(0)) revert ZeroAddress(); // EOA (machine owner) address cannot be zero

        // verify that the gas station owner approves this tx
        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), eoa, nonce)
        );

        if (!_verifySignature(messageHash, signature, nonce)) {
            revert InvalidSignature(messageHash, nonce); // Invalid Gas Station Owner signature
        }

        usedNonces[nonce] = true;

        // Deploy a new instance of MachineSmartAccount
        MachineSmartAccount newMachineSmartAccount = new MachineSmartAccount(
            eoa,
            address(this)
        );

        emit MachineSmartAccountDeployed(address(newMachineSmartAccount));
        return address(newMachineSmartAccount);
    }

    /**
     * @dev Transfer gas station balance to a new gas station in the event this gas station is deprecated.
     * @param newGasStationAddress The new gas station address that will replace this current gas station
     * @param signature The signature verifying the owner's tx approval.
     */
    function transferGasStationBalance(
        address newGasStationAddress,
        uint256 nonce,
        bytes calldata signature
    ) external onlyOwner {
        if (FUNDING_TOKEN == address(0)) revert ZeroAddress(); // Funding token address cannot be zero
        if (newGasStationAddress == address(0)) revert ZeroAddress(); // New Gas Station address cannot be zero
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce); // Nonce already used

        // Verify the owner's signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), newGasStationAddress, nonce)
        );

        if (!_verifySignature(messageHash, signature, nonce)) {
            revert InvalidSignature(messageHash, nonce); // Invalid Gas Station Owner signature
        }
        usedNonces[nonce] = true;

        // Check gas station's balance
        uint256 gasStationBalance = IERC20(FUNDING_TOKEN).balanceOf(
            address(this)
        );

        // Perform the token transfer
        bool success = IERC20(FUNDING_TOKEN).transfer(
            newGasStationAddress,
            gasStationBalance
        );

        if (!success) {
            revert TransferFailed(
                FUNDING_TOKEN,
                newGasStationAddress,
                gasStationBalance
            );
        }
    }

    /**
     * @dev Execute a transaction via the gas station factory contract.
     * @param eoa The user (machine owner) on whose behalf the transaction is executed.
     * @param target The target contract address where the call data will be executed
     * @param data The calldata for the transaction sent to the target contract address
     * @param signature The signature verifying the owner's tx approval.
     * @param eoaSignature The signature verifying the eoa (machine owner) tx approval.
     */
    function executeTransaction(
        address eoa,
        address machineAddress,
        address target,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature,
        bytes calldata eoaSignature
    ) external onlyGasStation {
        if (machineAddress == address(0)) revert ZeroAddress(); // Machine address cannot be zero
        if (eoa == address(0)) revert ZeroAddress(); // EOA (machine owner) address cannot be zero
        if (target == address(0)) revert ZeroAddress(); // Target address cannot be zero
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce); // Nonce already used

        // Verify the owner's signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), eoa, target, data, nonce)
        );

        if (!_verifySignature(messageHash, signature, nonce)) {
            revert InvalidSignature(messageHash, nonce); // Invalid Gas Station Owner signature
        }

        usedNonces[nonce] = true;

        // Transfer tokens with balance validation
        // This transfer is only done if the target address is peaq did, rbac or storage contract call
        if (
            FUNDING_TOKEN != address(0) &&
            (target == PEAQ_DID ||
                target == PEAQ_RBAC ||
                target == PEAQ_STORAGE)
        ) {
            // Fetch machine's balance
            uint256 machineBalance = IERC20(FUNDING_TOKEN).balanceOf(
                machineAddress
            );

            // Check if the machine balance is less than min balance before funding it
            // This is added because each machine account is required to pay a storage deposit fees by the peaq storage and did contracts.
            // the storage
            if (machineBalance <= MIN_BALANCE) {
                // Fund the machine adress balance
                IERC20(FUNDING_TOKEN).transfer(machineAddress, FUNDING_AMOUNT);
            }
        }

        // Forward the call to the machine account to execute the target tx
        MachineSmartAccount(machineAddress).execute(
            target,
            data,
            nonce,
            eoaSignature
        );
    }

    /**
     * @dev Verify the owner signature.
     * @param messageHash The hash of the signed message.
     * @param signature The signature to verify.
     * @param nonce Protects against replay attack.
     */
    function _verifySignature(
        bytes32 messageHash,
        bytes memory signature,
        uint256 nonce
    ) internal view returns (bool) {
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(hash, signature);

        return signer == owner;
    }
}
