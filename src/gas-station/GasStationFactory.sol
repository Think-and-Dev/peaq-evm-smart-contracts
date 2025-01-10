// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {MachineSmartAccount} from "./MachineSmartAccount.sol";
import {Errors} from "../libs/Errors.sol";
import {Events} from "../libs/Events.sol";
import {Constants} from "../libs/Constants.sol";

contract GasStationFactory is EIP712, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant GAS_STATION_ROLE = keccak256("GAS_STATION_ROLE");

    // EIP-712 type hashes
    bytes32 private constant DEPLOY_MACHINE_TYPEHASH =
        keccak256("DeployMachineSmartAccount(address eoa,uint256 nonce)");

    bytes32 private constant TRANSFER_BALANCE_TYPEHASH =
        keccak256(
            "TransferGasStationBalance(address newGasStationAddress,uint256 nonce)"
        );

    bytes32 private constant EXECUTE_TRANSACTION_TYPEHASH =
        keccak256(
            "ExecuteTransaction(address target,bytes data,uint256 nonce)"
        );

    bytes32 private constant EXECUTE_MACHINE_TRANSACTION_TYPEHASH =
        keccak256(
            "ExecuteMachineTransaction(address eoa,address machineAddress,address target,bytes data,uint256 nonce)"
        );

    //bool public gasStationDepreceted;
    mapping(uint256 => bool) private usedNonces;

    constructor(
        address admin,
        address gasStation
    ) EIP712("GasStationFactory", "1") {
        if (admin == address(0)) revert Errors.ZeroAddress();
        if (gasStation == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GAS_STATION_ROLE, gasStation);
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
    ) external onlyRole(GAS_STATION_ROLE) returns (address) {
        if (eoa == address(0)) revert Errors.ZeroAddress();

        bytes32 structHash = keccak256(
            abi.encode(DEPLOY_MACHINE_TYPEHASH, eoa, nonce)
        );

        if (!_verifySignature(structHash, signature, nonce)) {
            revert Errors.InvalidSignature(structHash, nonce);
        }

        usedNonces[nonce] = true;

        // Deploy a new instance of MachineSmartAccount
        MachineSmartAccount newMachineSmartAccount = new MachineSmartAccount(
            eoa,
            address(this)
        );

        emit Events.MachineSmartAccountDeployed(
            address(newMachineSmartAccount)
        );
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (Constants.FUNDING_TOKEN == address(0)) revert Errors.ZeroAddress();
        if (newGasStationAddress == address(0)) revert Errors.ZeroAddress();
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce);

        bytes32 structHash = keccak256(
            abi.encode(TRANSFER_BALANCE_TYPEHASH, newGasStationAddress, nonce)
        );

        if (!_verifySignature(structHash, signature, nonce)) {
            revert Errors.InvalidSignature(structHash, nonce);
        }
        usedNonces[nonce] = true;

        uint256 gasStationBalance = IERC20(Constants.FUNDING_TOKEN).balanceOf(
            address(this)
        );
        IERC20(Constants.FUNDING_TOKEN).safeTransfer(
            newGasStationAddress,
            gasStationBalance
        );

        emit Events.GasStationBalanceTransferred(
            address(this),
            newGasStationAddress,
            gasStationBalance,
            nonce
        );
    }

    /**
     * @dev Execute a transaction via the gas station factory contract.
     * The Gas Station contract will trigger the final target call
     * @param target The target contract address where the call data will be executed
     * @param data The calldata for the transaction sent to the target contract address
     * @param signature The signature verifying the owner's tx approval.
     */
    function executeTransaction(
        address target,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature
    ) external onlyRole(GAS_STATION_ROLE) {
        if (target == address(0)) revert Errors.ZeroAddress();
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce);

        bytes32 structHash = keccak256(
            abi.encode(
                EXECUTE_TRANSACTION_TYPEHASH,
                target,
                keccak256(data),
                nonce
            )
        );

        if (!_verifySignature(structHash, signature, nonce)) {
            revert Errors.InvalidSignature(structHash, nonce);
        }

        usedNonces[nonce] = true;
        (bool success, ) = target.call(data);

        if (!success) {
            revert Errors.TargetCallFailed(target);
        }

        emit Events.TransactionExecuted(target, data, nonce, msg.sender);
    }

    /**
     * @dev Execute a machine transaction via the gas station factory contract.
     * The Machine Smart Account will trigger the final target call
     * @param eoa The user (machine owner) on whose behalf the transaction is executed.
     * @param target The target contract address where the call data will be executed
     * @param data The calldata for the transaction sent to the target contract address
     * @param signature The signature verifying the owner's tx approval.
     * @param eoaSignature The signature verifying the eoa (machine owner) tx approval.
     */
    function executeMachineTransaction(
        address eoa,
        address machineAddress,
        address target,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature,
        bytes calldata eoaSignature
    ) external onlyRole(GAS_STATION_ROLE) {
        if (machineAddress == address(0)) revert Errors.ZeroAddress(); // Machine address cannot be zero
        if (eoa == address(0)) revert Errors.ZeroAddress(); // EOA (machine owner) address cannot be zero
        if (target == address(0)) revert Errors.ZeroAddress(); // Target address cannot be zero
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce); // Nonce already used

        // Verify the owner's signature
        bytes32 structHash = keccak256(
            abi.encode(
                EXECUTE_MACHINE_TRANSACTION_TYPEHASH,
                target,
                keccak256(data),
                nonce
            )
        );

        if (!_verifySignature(structHash, signature, nonce)) {
            revert Errors.InvalidSignature(structHash, nonce); // Invalid Gas Station Owner signature
        }

        usedNonces[nonce] = true;

        // Transfer tokens with balance validation
        // This transfer is only done if the target address is peaq did, rbac or storage contract call
        if (
            Constants.FUNDING_TOKEN != address(0) &&
            (target == Constants.PEAQ_DID ||
                target == Constants.PEAQ_RBAC ||
                target == Constants.PEAQ_STORAGE)
        ) {
            // Fetch machine's balance
            uint256 machineBalance = IERC20(Constants.FUNDING_TOKEN).balanceOf(
                machineAddress
            );

            // Check if the machine balance is less than min balance before funding it
            // This is added because each machine account is required to pay a storage deposit fees by the peaq storage and did contracts.
            // the storage
            if (machineBalance <= Constants.MIN_BALANCE) {
                // Fund the machine adress balance
                IERC20(Constants.FUNDING_TOKEN).safeTransfer(
                    machineAddress,
                    Constants.FUNDING_AMOUNT
                );
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

    function getDomainSeparator() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Verify the owner signature.
     * @param structHash The hash of the signed message.
     * @param signature The signature to verify.
     * @param nonce Protects against replay attack.
     */
    function _verifySignature(
        bytes32 structHash,
        bytes memory signature,
        uint256 nonce
    ) internal view returns (bool) {
        if (usedNonces[nonce]) revert Errors.NonceAlreadyUsed(nonce);

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        return hasRole(DEFAULT_ADMIN_ROLE, signer);
    }

    // Note: "Unable to determine contract standard" error is throw during native token transfer
    // to the contract address when using metamask (other wallet provider not tested though)
    // receive() and fallback() is added to adhere to contract standard
    // A receive function to accept native tokens
    receive() external payable {
        emit Events.OnReceivedCall();
    }

    // A fallback function to handle other unexpected calls
    fallback() external payable {
        emit Events.OnFailbackCall();
    }
}
