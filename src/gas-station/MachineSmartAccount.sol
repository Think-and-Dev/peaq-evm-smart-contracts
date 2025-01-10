// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Errors} from "../libs/Errors.sol";
import {Events} from "../libs/Events.sol";

contract MachineSmartAccount is EIP712, AccessControl {
    address public owner;

    bytes32 public constant ENTRY_POINT_ROLE = keccak256("ENTRY_POINT_ROLE");

    // EIP-712 type hashes
    bytes32 private constant EXECUTE_TYPEHASH =
        keccak256(
            "Execute(address target,bytes data,uint256 nonce,bytes signature)"
        );
    mapping(uint256 => bool) public usedNonces;

    constructor(
        address _owner,
        address _entryPoint
    ) EIP712("MachineSmartAccount", "1") {
        if (_owner == address(0)) revert Errors.ZeroAddress(); // Owner address cannot be zero
        if (_entryPoint == address(0)) revert Errors.ZeroAddress(); // EntryPoint cannot be zero
        owner = _owner;
        _grantRole(ENTRY_POINT_ROLE, _entryPoint);
    }

    /**
     * @dev Verify the eoa (machine owner) signature.
     * @param userOpHash The hash of the signed message.
     * @param signature The signature to verify.
     * @param nonce Protects against replay attack.
     */
    function validateUserOp(
        bytes32 userOpHash,
        bytes memory signature,
        uint256 nonce
    ) public view returns (bool) {
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 digest = _hashTypedDataV4(userOpHash);
        address signer = ECDSA.recover(digest, signature);

        return signer == owner;
    }

    /**
     * @dev Execute the target tx
     * @param target The target contract address where the call data will be executed
     * @param data The calldata for the transaction sent to the target contract address
     * @param signature The signature verifying the eoa (machine owner) tx approval.
     * @param nonce Protects against replay attack.
     */
    function execute(
        address target,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature
    ) external {
        if (!hasRole(ENTRY_POINT_ROLE, msg.sender) && msg.sender != owner) {
            revert Errors.NotAuthorized(msg.sender);
        }

        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 userOpHash = keccak256(
            abi.encode(EXECUTE_TYPEHASH, target, keccak256(data), nonce)
        );
        if (!validateUserOp(userOpHash, signature, nonce)) {
            revert Errors.InvalidSignature(userOpHash, nonce); // Invalid EOA (machine owner) signature
        }

        usedNonces[nonce] = true;

        (bool success, ) = target.call(data);

        if (!success) {
            revert Errors.TargetCallFailed(target);
        }
    }
}
