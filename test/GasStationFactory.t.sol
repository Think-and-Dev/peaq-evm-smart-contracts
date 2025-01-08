// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test} from "forge-std/Test.sol";
import {GasStationFactory} from "../src/gas-station/GasStationFactory.sol";
import {MachineSmartAccount} from "../src/gas-station/MachineSmartAccount.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract GasStationFactoryTest is Test {
    using ECDSA for bytes32;

    GasStationFactory public factory;
    address public admin;
    address public gasStation;
    address public user;
    uint256 public adminPrivateKey;
    uint256 public gasStationPrivateKey;
    uint256 public userPrivateKey;

    // EIP-712 type hashes
    bytes32 constant DEPLOY_MACHINE_TYPEHASH = keccak256("DeployMachineSmartAccount(address eoa,uint256 nonce)");
    bytes32 constant TRANSFER_BALANCE_TYPEHASH =
        keccak256("TransferGasStationBalance(address newGasStationAddress,uint256 nonce)");
    bytes32 constant EXECUTE_TRANSACTION_TYPEHASH =
        keccak256("ExecuteTransaction(address target,bytes data,uint256 nonce)");
    bytes32 constant EXECUTE_MACHINE_TRANSACTION_TYPEHASH = keccak256(
        "ExecuteMachineTransaction(address eoa,address machineAddress,address target,bytes data,uint256 nonce)"
    );

    function setUp() public {
        adminPrivateKey = 0x1;
        gasStationPrivateKey = 0x2;
        userPrivateKey = 0x3;

        admin = vm.addr(adminPrivateKey);
        gasStation = vm.addr(gasStationPrivateKey);
        user = vm.addr(userPrivateKey);

        factory = new GasStationFactory(admin, gasStation);
    }

    function testTransferGasStationBalance() public {
        address newGasStation = address(0x123);
        uint256 nonce = 0;
        uint256 amount = 100 ether;

        //  mock ERC20 at the FUNDING_TOKEN address (0x809)
        address fundingToken = address(0x0000000000000000000000000000000000000809);
        MockERC20 token = new MockERC20("PEAQ Token", "PEAQ");

        // Etch the mock token to the FUNDING_TOKEN address
        vm.etch(fundingToken, address(token).code);

        // Mint tokens to the factory contract using the mocked token at FUNDING_TOKEN address
        MockERC20(fundingToken).mint(address(factory), amount);

        bytes32 structHash = keccak256(abi.encode(TRANSFER_BALANCE_TYPEHASH, newGasStation, nonce));

        bytes32 digest = _hashTypedDataV4(factory.getDomainSeparator(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(admin);
        factory.transferGasStationBalance(newGasStation, nonce, signature);

        // Verify the balance was transferred
        assertEq(MockERC20(fundingToken).balanceOf(newGasStation), amount);
        assertEq(MockERC20(fundingToken).balanceOf(address(factory)), 0);
    }

    function testExecuteTransaction() public {
        address target = address(0x456);
        bytes memory data = abi.encodeWithSignature("someFunction()");
        uint256 nonce = 0;

        bytes32 structHash = keccak256(abi.encode(EXECUTE_TRANSACTION_TYPEHASH, target, keccak256(data), nonce));

        bytes32 digest = _hashTypedDataV4(factory.getDomainSeparator(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Mocking the target contract
        vm.etch(target, hex"00");
        vm.mockCall(target, data, abi.encode());

        vm.prank(gasStation);
        factory.executeTransaction(target, data, nonce, signature);
    }

    function testInvalidDomainSeparator() public {
        uint256 nonce = 0;
        bytes32 structHash = keccak256(abi.encode(DEPLOY_MACHINE_TYPEHASH, user, nonce));

        // Use wrong domain separator
        bytes32 wrongDomainSeparator = keccak256("WrongDomain");
        bytes32 digest = _hashTypedDataV4(wrongDomainSeparator, structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(gasStation);
        vm.expectRevert(); // Should revert with invalid signature
        factory.deployMachineSmartAccount(user, nonce, signature);
    }

    function testInvalidStructHash() public {
        uint256 nonce = 0;
        // Use wrong struct hash format
        bytes32 wrongStructHash = keccak256(abi.encode(user, nonce)); // Missing TYPEHASH

        bytes32 digest = _hashTypedDataV4(factory.getDomainSeparator(), wrongStructHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(gasStation);
        vm.expectRevert(); // Should revert with invalid signature
        factory.deployMachineSmartAccount(user, nonce, signature);
    }

    function testNonceReplayProtectionAcrossFunctions() public {
        uint256 nonce = 0;

        bytes32 deployStructHash = keccak256(abi.encode(DEPLOY_MACHINE_TYPEHASH, user, nonce));
        bytes32 deployDigest = _hashTypedDataV4(factory.getDomainSeparator(), deployStructHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, deployDigest);
        bytes memory deploySignature = abi.encodePacked(r, s, v);

        vm.prank(gasStation);
        factory.deployMachineSmartAccount(user, nonce, deploySignature);

        address newGasStation = address(0x123);
        bytes32 transferStructHash = keccak256(abi.encode(TRANSFER_BALANCE_TYPEHASH, newGasStation, nonce));
        bytes32 transferDigest = _hashTypedDataV4(factory.getDomainSeparator(), transferStructHash);
        (v, r, s) = vm.sign(adminPrivateKey, transferDigest);
        bytes memory transferSignature = abi.encodePacked(r, s, v);

        vm.prank(admin);
        vm.expectRevert(); // Should revert with nonce already used
        factory.transferGasStationBalance(newGasStation, nonce, transferSignature);
    }

    // helper function to create EIP-712 digest
    function _hashTypedDataV4(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function testDeployAndExecuteMachineTransaction() public {
        uint256 nonce = 0;

        bytes32 deployStructHash = keccak256(
            abi.encode(
                DEPLOY_MACHINE_TYPEHASH,
                user, // EOA address
                nonce
            )
        );

        bytes32 deployDigest = _hashTypedDataV4(factory.getDomainSeparator(), deployStructHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(adminPrivateKey, deployDigest);
        bytes memory deploySignature = abi.encodePacked(r, s, v);

        vm.prank(gasStation);
        address machineAddress = factory.deployMachineSmartAccount(user, nonce, deploySignature);

        address target = address(0x789);
        bytes memory data = abi.encodeWithSignature("someFunction()");
        uint256 execNonce = 1; // New nonce for execution

        bytes32 execStructHash = keccak256(
            abi.encode(EXECUTE_MACHINE_TRANSACTION_TYPEHASH, user, machineAddress, target, keccak256(data), execNonce)
        );

        bytes32 execDigest = _hashTypedDataV4(factory.getDomainSeparator(), execStructHash);
        (v, r, s) = vm.sign(adminPrivateKey, execDigest);
        bytes memory gasStationSignature = abi.encodePacked(r, s, v);

        bytes32 eoaMessageHash = keccak256(abi.encodePacked(machineAddress, target, data, execNonce));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(eoaMessageHash);
        (v, r, s) = vm.sign(userPrivateKey, ethSignedMessageHash);
        bytes memory eoaSignature = abi.encodePacked(r, s, v);

        // Mocking target contract
        vm.etch(target, hex"00");
        vm.mockCall(target, data, abi.encode());

        vm.prank(gasStation);
        factory.executeMachineTransaction(
            user, machineAddress, target, data, execNonce, gasStationSignature, eoaSignature
        );
    } 
}
