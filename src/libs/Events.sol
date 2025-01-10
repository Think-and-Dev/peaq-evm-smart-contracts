// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

library Events {
    event MetaTransactionExecuted(
        address indexed user,
        address indexed relayer,
        address target,
        bytes functionCall
    );
    event MachineBalanceTransferred(
        address indexed machineAddress,
        address indexed recipientAddress,
        uint256 amount,
        uint256 nonce
    );
    event MachineSmartAccountDeployed(address indexed deployedAddress);
    event GasStationBalanceTransferred(
        address indexed oldGasStation,
        address indexed newGasStation,
        uint256 amount,
        uint256 nonce
    );
    event TransactionExecuted(
        address indexed target,
        bytes data,
        uint256 nonce,
        address indexed executor
    );
    event OnReceivedCall();
    event OnFailbackCall();
}
