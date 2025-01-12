// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

library Events {
    event MachineTransactionExecuted(
        address indexed sender, address indexed machineAddress, address target, bytes functionCalldata
    );
    event MachineBatchTransactionExecuted(address indexed sender, address indexed machineAddress, address[] targets);
    event MachineBalanceTransferred(
        address indexed machineAddress, address indexed recipientAddress, uint256 amount, uint256 nonce
    );
    event MachineSmartAccountDeployed(address indexed deployedAddress);
    event MachineStationBalanceTransferred(
        address indexed oldMachineStation, address indexed newMachineStation, uint256 amount, uint256 nonce
    );
    event TransactionExecuted(address indexed target, bytes data, uint256 nonce, address indexed executor);
    event OnReceivedCall();
    event OnFailbackCall();
}
