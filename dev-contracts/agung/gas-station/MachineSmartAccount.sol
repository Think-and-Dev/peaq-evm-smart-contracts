// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MachineSmartAccount {
    using ECDSA for bytes32;

    address public owner;
    address public entryPoint;
    mapping(uint256 => bool) public usedNonces;

    error ZeroAddress();
    error NonceAlreadyUsed(uint256 nonce);
    error InvalidSignature(bytes32 messageHash, uint256 nonce);
    error NotAuthorized(address caller);
    error TargetCallFailed(address target);

    constructor(address _owner, address _entryPoint) {
        if (_owner == address(0)) revert ZeroAddress(); // Owner address cannot be zero
        if (_entryPoint == address(0)) revert ZeroAddress(); // EntryPoint cannot be zero
        owner = _owner;
        entryPoint = _entryPoint;
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
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address signer = ECDSA.recover(hash, signature);

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
        if (msg.sender != entryPoint && msg.sender != owner) {
            revert NotAuthorized(msg.sender);
        }

        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce); // Nonce already used

        bytes32 userOpHash = keccak256(
            abi.encodePacked(address(this), target, data, nonce)
        );
        if (!validateUserOp(userOpHash, signature, nonce)) {
            revert InvalidSignature(userOpHash, nonce); // Invalid EOA (machine owner) signature
        }

        usedNonces[nonce] = true;

        (bool success, ) = target.call(data);

        if (!success) {
            revert TargetCallFailed(target);
        }
    }
}
