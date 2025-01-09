// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

library Errors {
    error ZeroAddress();
    error NonceAlreadyUsed(uint256 nonce);
    error InvalidSignature(bytes32 messageHash, uint256 nonce);
    error TransferFailed(address token, address recipient, uint256 amount);
    error NotAuthorized(address caller);
    error TargetCallFailed(address target);
}
