import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { TransactionReceipt } from 'web3-types';
import { Sdk } from '@peaq-network/sdk';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

// Import the contract ABI
import {abi} from '../MachineStationFactoryABI.json';
import { AbiCoder, ethers } from 'ethers';

let machineAddress = "" // to be replaced after submitDeployMachineSmartAccountTx is triggered

// Web3 setup
// for agung: https://erpc-async.agung.peaq.network
// for peaq: https://peaq.api.onfinality.io/public

// chainID:
// agung: 9990
// peaq: 3338

const rpcURL = "https://erpc-async.agung.peaq.network";
const chainID = 9990;

// Contract details
const MachineStationFactoryContractAddress: string = '0x31B80DbA6806E0335Bfac6D12A5A820C32D73d68'; // Replace with the deployed Gas station factory contract address
const contract = new ethers.ContractFactory(abi as AbiItem[], MachineStationFactoryContractAddress);

// Wallet details
const ownerPrivateKey: string | undefined = process.env.CONTRACT_OWNER_PRIVATE_KEY??""; // Replace with your wallet's private key
const machineOwnerPrivateKey: string | undefined = process.env.MACHINE_OWNER_PRIVATE_KEY??""; // Replace with your wallet's private key

const provider = new ethers.JsonRpcProvider(rpcURL);

const ownerAccount = new ethers.Wallet(ownerPrivateKey, provider);
const machineOwnerAccount = new ethers.Wallet(machineOwnerPrivateKey, provider);


class MachineStationFactoryExample {

    async submitDeployMachineSmartAccountTx() {

        const machineOwner = machineOwnerAccount.address;
        const nonce = this.getRandomNonce();
      
        const deploySignature = await this.ownerSignTypedDataDeployMachineSmartAccount(machineOwner, nonce)
      
        machineAddress = await this.deployMachineSmartAccount(machineOwner, nonce, deploySignature);
    }

    async submitMachineTransferBalanceTx() {
        const recipientAddress = machineOwnerAccount.address;
        const nonce = this.getRandomNonce();
      
        const machineOwnerSignature = await this.machineOwnerSignTypedDataTransferMachineBalance(recipientAddress, nonce)
        const ownerSignature = await this.ownerSignTypedDataTransferMachineBalance(machineAddress, recipientAddress, nonce)
      
        console.log("nonce:", nonce);
        console.log("machineOwnerSignature:", machineOwnerSignature);
        console.log("ownerSignature:", ownerSignature);
        await this.executeMachineTransferBalance(machineAddress, recipientAddress, nonce, ownerSignature, machineOwnerSignature);
      
    }

    async submitGetRealStorageTx() {
      try {
          const nonce = this.getRandomNonce();
          const target = '0x0000000000000000000000000000000000000801'; // Replace with the target contract address
    
          const abiCoder = new AbiCoder()
    
          const addItemFunctionSignature = "addItem(bytes,bytes)";
          const addItemFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(addItemFunctionSignature)).substring(0, 10);
    
          let now = new Date().getTime();
    
          const itemType = "GET-REAL-CAMPAIGN-ITEM-TYPE" + now
          const itemTypeHex = ethers.hexlify(ethers.toUtf8Bytes(itemType));
          const item = "TASK-COMPLETED"
          const itemHex = ethers.hexlify(ethers.toUtf8Bytes(item));
    
          const params = abiCoder.encode(
              ["bytes", "bytes"],
              [itemTypeHex, itemHex]
          );
    
          const calldata = params.replace("0x", addItemFunctionSelector);
          const ownerSignature = await this.ownerSignTypedDataExecuteTransaction(target, calldata, nonce)
    
          await this.executeTransaction(target, calldata, nonce, ownerSignature,);
      } catch (error) {
          console.error('Error:', error);
      }
    }

    async deployMachineSmartAccount(
        machineOwner: string,
        nonce: BigInt,
        signature: string
    ): Promise<string> {
      try {
          // Encode the method call data
          const methodData = contract.interface.encodeFunctionData(
            "deployMachineSmartAccount",
            [machineOwner, nonce, signature]
        );

        // Send the transaction and get the receipt
        const txResponse = await this.sendTransaction(methodData);

        let receipt = await txResponse.wait().finally();

        const logs = receipt?.logs;

        // Compute the event signature
        const eventSignature = ethers.id("MachineSmartAccountDeployed(address)");
        console.log("eventSignature: ", eventSignature);

        // Find the relevant log
        const log = logs?.find((log) => log.topics[0] === eventSignature);

        console.log("raw log: ", log);

        if (!log) {
            throw new Error("MachineSmartAccountDeployed event not found in logs");
        }


        // The deployed address is stored as the second topic (topics[1]) in a 32-byte format
        const rawDeployedAddress = log.topics[1];
        const deployedAddress = ethers.getAddress(`0x${rawDeployedAddress.slice(26)}`); // Extract last 20 bytes

        console.log('Machine Deploy Tx executed:', receipt?.hash);
        console.log("Machine Deployed Address:", deployedAddress);
        return deployedAddress;
        
      } catch (error: any) {
        console.error("Transaction failed. Error:", error);

        // Check if the error is a revert error with data
        if (error.data) {
          try {
            // Decode the revert error using the contract's ABI
            const iface = new ethers.Interface(contract.interface.fragments);
            const decodedError = iface.parseError(error.data);

            console.log("Decoded Error:", decodedError);

            // Extract error name and arguments
            // const { name, args } = decodedError;
            // console.log("Error Name:", name);
            // console.log("Arguments:", args);

            // if (name === "InvalidSignature") {
            //   console.error("InvalidSignature Error Details:");
            //   console.error("structHash:", args.structHash);
            //   console.error("nonce:", args.nonce.toString());
            // }
          } catch (decodeError) {
            console.error("Failed to decode error data:", decodeError);
          }
        } else {
          console.error("Transaction failed without revert data:", error);
        }
      }
      return "";
    }

    async executeMachineTransferBalance(
        machineAddress: string,
        recipientAddress: string,
        nonce: BigInt,
        signature: string,
        machineOwnerSignature: string,
    ): Promise<void> {
      try {
        // Encode the method call data
        const methodData = contract.interface.encodeFunctionData(
          "executeMachineTransferBalance",
          [machineAddress, recipientAddress, nonce, signature, machineOwnerSignature]
        );
  
        // Send the transaction and get the receipt
        const txResponse = await this.sendTransaction(methodData);
  
        console.log("txResponse: ", txResponse);
  
        let receipt = await txResponse.wait().finally();
  
          console.log('Machine Balance Transfer Tx executed:', receipt?.hash);
  
      } catch (error: any) {
        console.error("Transaction failed. Error:", error);
  
        // Check if the error is a revert error with data
        if (error.data) {
          try {
            // Decode the revert error using the contract's ABI
            const iface = new ethers.Interface(contract.interface.fragments);
            const decodedError = iface.parseError(error.data);
  
            console.log("Decoded Error:", decodedError);
  
            // Extract error name and arguments
            // const { name, args } = decodedError;
            // console.log("Error Name:", name);
            // console.log("Arguments:", args);
  
            // if (name === "InvalidSignature") {
            //   console.error("InvalidSignature Error Details:");
            //   console.error("structHash:", args.structHash);
            //   console.error("nonce:", args.nonce.toString());
            // }
          } catch (decodeError) {
            console.error("Failed to decode error data:", decodeError);
          }
        } else {
          console.error("Transaction failed without revert data:", error);
        }
      }
    }

    async executeTransaction(
      target: string,
      data: string,
      nonce: BigInt,
      signature: string,
    ): Promise<void> {
      try {
        // Encode the method call data
        const methodData = contract.interface.encodeFunctionData(
          "executeTransaction",
          [target, data, nonce, signature]
        );

        // Send the transaction and get the receipt
        const txResponse = await this.sendTransaction(methodData);

        let receipt = await txResponse.wait().finally();

        console.log('Normal Tx executed:', receipt?.hash);

      } catch (error: any) {
        console.error("Transaction failed. Error:", error);

        // Check if the error is a revert error with data
        if (error.data) {
          try {
            // Decode the revert error using the contract's ABI
            const iface = new ethers.Interface(contract.interface.fragments);
            const decodedError = iface.parseError(error.data);

            console.log("Decoded Error:", decodedError);

            // Extract error name and arguments
            // const { name, args } = decodedError;
            // console.log("Error Name:", name);
            // console.log("Arguments:", args);

            // if (name === "InvalidSignature") {
            //   console.error("InvalidSignature Error Details:");
            //   console.error("structHash:", args.structHash);
            //   console.error("nonce:", args.nonce.toString());
            // }
          } catch (decodeError) {
            console.error("Failed to decode error data:", decodeError);
          }
        } else {
          console.error("Transaction failed without revert data:", error);
        }
      }
    }

    async ownerSignTypedDataDeployMachineSmartAccount(
        machineOwner: string,
        nonce: BigInt
      ): Promise<string> {
        // Define the EIP-712 Domain
        const domain = {
          name: "MachineStationFactory",
          version: "1",
          chainId: chainID,
          verifyingContract: MachineStationFactoryContractAddress,
        };
    
        console.log("machineOwner: ", machineOwner)
      
        // Define the type definition for the data
        const types = {
          DeployMachineSmartAccount: [
            { name: "machineOwner", type: "address" },
            { name: "nonce", type: "uint256" },
          ],
        };
      
        // Define the data to be signed
        const message = {
          machineOwner: machineOwner,
          nonce: nonce,
        };
    
        console.log("ownerAccount: ", ownerAccount.address);
      
        // Sign the typed data
        const signature = await ownerAccount.signTypedData(domain, types, message);
      
        return signature;
    }

    async ownerSignTypedDataTransferMachineBalance(
        machineAddress: string,
        recipientAddress: string,
        nonce: BigInt,
      ): Promise<string> {
        // Step 1: Define the EIP-712 Domain
        const domain = {
          name: "MachineStationFactory", 
          version: "1", 
          chainId: chainID,
          verifyingContract: MachineStationFactoryContractAddress,
        };
      
        const types = {
          ExecuteMachineTransferBalance: [
            { name: "machineAddress", type: "address" },
            { name: "recipientAddress", type: "address" },
            { name: "nonce", type: "uint256" },
          ],
        };
    
        const message = {
          machineAddress: machineAddress,
          recipientAddress: recipientAddress,
          nonce: nonce,
        };

        const signature = await ownerAccount.signTypedData(domain, types, message);
        return signature;
    }
    
    async machineOwnerSignTypedDataTransferMachineBalance(
        recipientAddress: string,
        nonce: BigInt,
      ): Promise<string> {
        // Step 1: Define the EIP-712 Domain
        const domain = {
          name: "MachineSmartAccount", 
          version: "1", 
          chainId: chainID,
          verifyingContract: machineAddress,
        };
      
        const types = {
          TransferMachineBalance: [
            { name: "recipientAddress", type: "address" },
            { name: "nonce", type: "uint256" },
          ],
        };
      
        const message = {
          recipientAddress: recipientAddress,
          nonce: nonce,
        };
    
        const signature = await machineOwnerAccount.signTypedData(domain, types, message);
        return signature;
    }

    async ownerSignTypedDataExecuteTransaction(
      target: string,
      data: string,
      nonce: BigInt,
    ): Promise<string> {
      // Step 1: Define the EIP-712 Domain
      const domain = {
        name: "MachineStationFactory", 
        version: "1", 
        chainId: chainID,
        verifyingContract: MachineStationFactoryContractAddress,
      };
    
      const types = {
        ExecuteTransaction: [
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      };
  
      const message = {
        target: target,
        data: data,
        nonce: nonce,
      };
    
      const signature = await ownerAccount.signTypedData(domain, types, message);
    
      return signature;
    }

    // Helper function to sign and send transactions
    async sendTransaction(
        methodData: string
    ): Promise<ethers.TransactionResponse> {


      const tx = {
        to: MachineStationFactoryContractAddress,
        data: methodData,
      };

      return await ownerAccount.sendTransaction(tx);

    }
    
    getRandomNonce(): BigInt {
        const now = BigInt(Date.now());
        const randomPart = BigInt(Math.floor(Math.random() * 1e18));
        return now * randomPart;
    }
    
}

const machineStationExample = new MachineStationFactoryExample();

// Example usage
(async () => {

    // deploy machine smart account
    await machineStationExample.submitDeployMachineSmartAccountTx();
    // Transfer the balance of a machine to a recipient
    await machineStationExample.submitMachineTransferBalanceTx();
    
})();