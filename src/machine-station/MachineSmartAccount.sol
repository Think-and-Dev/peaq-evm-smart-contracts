// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BATCH_CONTRACT} from "../libs/interfaces/Batch.sol";
import {Errors} from "../libs/Errors.sol";
import {Events} from "../libs/Events.sol";
import {Constants} from "../libs/Constants.sol";

contract MachineSmartAccount is EIP712, AccessControl {
    using SafeERC20 for IERC20;

    address public owner;
    // Batch call value
    uint256[] batch_call_value;
    uint64[] gas_limit_value;

    bytes32 public constant MACHINE_STATION_ROLE = keccak256("MACHINE_STATION_ROLE");

    // EIP-712 type hashes
    bytes32 private constant EXECUTE_TYPEHASH = keccak256("Execute(address target,bytes data,uint256 nonce)");
    bytes32 private constant EXECUTE_BATCH_TYPEHASH = keccak256("Execute(address[] target,bytes[] data,uint256 nonce)");
    bytes32 private constant TRANSFER_BALANCE_TYPEHASH =
        keccak256("TransferMachineBalance(address newMachineAddress,uint256 nonce)");

    mapping(uint256 => bool) public usedNonces;

    constructor(address _owner, address machineStation) EIP712("MachineSmartAccount", "1") {
        if (_owner == address(0)) revert Errors.ZeroAddress(); // Owner address cannot be zero
        if (machineStation == address(0)) revert Errors.ZeroAddress(); // Machine Station cannot be zero
        owner = _owner;
        _grantRole(DEFAULT_ADMIN_ROLE, machineStation);
        _grantRole(MACHINE_STATION_ROLE, machineStation);
    }

    /**
     * @dev Verify the machine owner signature.
     * @param userOpHash The hash of the signed message.
     * @param signature The signature to verify.
     * @param nonce Protects against replay attack.
     */
    function validateUserOp(bytes32 userOpHash, bytes memory signature, uint256 nonce) public view returns (bool) {
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 digest = _hashTypedDataV4(userOpHash);
        address signer = ECDSA.recover(digest, signature);

        return signer == owner;
    }

    /**
     * @dev Execute the target tx
     * @param target The target contract address where the call data will be executed
     * @param data The calldata for the transaction sent to the target contract address
     * @param signature The signature verifying the machine owner tx approval.
     * @param nonce Protects against replay attack.
     */
    function execute(address target, bytes calldata data, uint256 nonce, bytes calldata signature) external {
        if (!hasRole(MACHINE_STATION_ROLE, msg.sender) && msg.sender != owner) {
            revert Errors.NotAuthorized(msg.sender);
        }

        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 userOpHash = keccak256(abi.encode(EXECUTE_TYPEHASH, target, keccak256(data), nonce));
        if (!validateUserOp(userOpHash, signature, nonce)) {
            revert Errors.InvalidSignature(userOpHash, nonce); // Invalid machine owner signature
        }

        usedNonces[nonce] = true;

        (bool success,) = target.call(data);

        if (!success) {
            revert Errors.TargetCallFailed(target);
        }
        emit Events.MachineTransactionExecuted(msg.sender, address(this), target, data);
    }

    /**
     * @dev Execute batch transaction using the target addresses and their respective call data
     * @param targets The target contract addresses where the call data will be executed
     * @param data The array of calldata for the transaction sent to the target contract addresses
     * @param signature The signature verifying the machine owner tx approval.
     * @param nonce Protects against replay attack.
     */
    function executeBatch(address[] memory targets, bytes[] memory data, uint256 nonce, bytes calldata signature)
        external
    {
        if (!hasRole(MACHINE_STATION_ROLE, msg.sender) && msg.sender != owner) {
            revert Errors.NotAuthorized(msg.sender);
        }

        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 userOpHash = keccak256(abi.encode(EXECUTE_BATCH_TYPEHASH, targets, keccak256(abi.encode(data)), nonce));
        if (!validateUserOp(userOpHash, signature, nonce)) {
            revert Errors.InvalidSignature(userOpHash, nonce); // Invalid machine owner signature
        }

        usedNonces[nonce] = true;

        BATCH_CONTRACT.batchAll(targets, batch_call_value, data, gas_limit_value);

        emit Events.MachineBatchTransactionExecuted(msg.sender, address(this), targets);
    }

    /**
     * @dev Transfer machine smart account balance to an account.
     * @param recipientAddress The recipient of the tokens
     * @param nonce Protects against replay attack.
     * @param signature The signature verifying the machine owner's tx approval.
     */
    function transferMachineBalance(address recipientAddress, uint256 nonce, bytes calldata signature)
        external
        onlyRole(MACHINE_STATION_ROLE)
    {
        if (Constants.FUNDING_TOKEN == address(0)) revert Errors.ZeroAddress();
        if (recipientAddress == address(0)) revert Errors.ZeroAddress();
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce);

        bytes32 structHash = keccak256(abi.encode(TRANSFER_BALANCE_TYPEHASH, recipientAddress, nonce));

        if (!validateUserOp(structHash, signature, nonce)) {
            revert Errors.InvalidSignature(structHash, nonce);
        }
        usedNonces[nonce] = true;

        uint256 machineBalance = IERC20(Constants.FUNDING_TOKEN).balanceOf(address(this));
        IERC20(Constants.FUNDING_TOKEN).safeTransfer(recipientAddress, machineBalance);

        emit Events.MachineBalanceTransferred(address(this), recipientAddress, machineBalance, nonce);
    }

    function getDomainSeparator() public view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
