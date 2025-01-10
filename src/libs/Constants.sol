// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

library Constants {
    uint256 constant MIN_BALANCE = 10000000000000000; // 0.01 tokens in 18 decimals
    uint256 constant FUNDING_AMOUNT = 50000000000000000; // 0.05 tokens in 18 decimals
    address constant FUNDING_TOKEN =
        address(0x0000000000000000000000000000000000000809); // PEAQ token contract address
    address constant PEAQ_RBAC =
        address(0x0000000000000000000000000000000000000802); // peaq RBAC contract address
    address constant PEAQ_DID =
        address(0x0000000000000000000000000000000000000800); // peaq DID contract address
    address constant PEAQ_STORAGE =
        address(0x0000000000000000000000000000000000000801); // peaq storage contract address

    // agung specific constants
    uint256 constant AGUNG_MIN_BALANCE = 330000000000000000; // 0.33 tokens in 18 decimals
    uint256 constant AGUNG_FUNDING_AMOUNT = 50000000000000000; // 0.05 tokens in 18 decimals
}
