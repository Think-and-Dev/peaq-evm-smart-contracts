import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { TransactionReceipt } from 'web3-types';
import { Sdk } from '@peaq-network/sdk';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

// Import the contract ABI
import { abi } from '../GasStationFactoryABI.json';
import { AbiCoder, ethers } from 'ethers';

let machineAddress = "" // to be replaced after submitDeployMachineSmartAccountTx is triggered

// Web3 setup
// for agung: https://erpc-async.agung.peaq.network
// for peaq: https://peaq.api.onfinality.io/public
const web3 = new Web3('https://erpc-async.agung.peaq.network');

// Contract details
const GasStationFactoryContractAddress: string = 'CONTRACT_ADDRESS'; // Replace with the deployed Gas station factory contract address
const contract = new web3.eth.Contract(abi as AbiItem[], GasStationFactoryContractAddress);

// Wallet details
const ownerPrivateKey: string = 'YOUR_PRIVATE_KEY'; // Replace with your wallet's private key
const eoaPrivateKey: string = 'YOUR_PRIVATE_KEY'; // Replace with your wallet's private key
const ownerAccount = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);
const eoaAccount = web3.eth.accounts.privateKeyToAccount(eoaPrivateKey);

// Helper function to sign and send transactions
async function sendTransaction(
    methodData: string,
    gas: number
): Promise<TransactionReceipt> {
    const tx = {
        from: ownerAccount.address,
        to: GasStationFactoryContractAddress,
        gas,
        data: methodData,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);
    if (!signedTx.rawTransaction) {
        throw new Error('Failed to sign transaction');
    }

    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

// Functions to interact with the contract

async function deployMachineSmartAccount(
    eoa: string,
    nonce: number,
    signature: string
): Promise<string> {
    const methodData = contract.methods
        .deployMachineSmartAccount(eoa, nonce, signature)
        .encodeABI();

    const receipt = await sendTransaction(methodData, 300000);

    // Check if events are directly available
    if (receipt.events?.MachineSmartAccountDeployed?.returnValues?.deployedAddress) {
        return receipt.events.MachineSmartAccountDeployed.returnValues.deployedAddress as string;
    }

    // Parse logs manually if events are not populated
    const logs = receipt.logs;
    const eventAbi = {
        name: "MachineSmartAccountDeployed",
        type: "event",
        inputs: [
            {
                indexed: false, 
                name: "deployedAddress",
                type: "address",
            },
        ],
    };
    

    const eventSignature = web3.eth.abi.encodeEventSignature(eventAbi);
    const log = logs.find((log) => log?.topics?.[0] === eventSignature);

    if (!log) {
        throw new Error('MachineSmartAccountDeployed event not found in logs');
    }

    // Decode the event data
    const decodedLog = web3.eth.abi.decodeLog(
        eventAbi.inputs as any,
        log.data as string,
        log.topics?.slice(1) as string[]
    );

    const deployedAddress = decodedLog.deployedAddress as string;

    if (!deployedAddress) {
        throw new Error('Failed to retrieve deployed MachineSmartAccount address');
    }

    console.log('MachineSmartAccount deployed:', deployedAddress);
    return deployedAddress;
}

async function executeTransaction(
    target: string,
    data: string,
    nonce: number,
    signature: string,
): Promise<void> {
    const methodData = contract.methods
        .executeTransaction(target, data, nonce, signature)
        .encodeABI();
    const receipt = await sendTransaction(methodData, 500000);
    console.log('Transaction executed:', receipt);
}

async function executeMachineTransaction(
    eoa: string,
    machineAddress: string,
    target: string,
    data: string,
    nonce: number,
    signature: string,
    eoaSignature: string
): Promise<void> {
    const methodData = contract.methods
        .executeTransaction(eoa, machineAddress, target, data, nonce, signature, eoaSignature)
        .encodeABI();
    const receipt = await sendTransaction(methodData, 500000);
    console.log('Transaction executed:', receipt);
}

function generateOwnerSignature(target: string, data: string, nonce: number): string {

    const messageHash =  ethers.solidityPackedKeccak256(
        ["address", "address", "bytes", "uint256"],
        [GasStationFactoryContractAddress, target, data, nonce]
    );

    const signature = ownerAccount.sign(messageHash).signature;

    return signature
}

function generateOwnerSignatureForMachineTx(eoa: string, target: string, data: string, nonce: number): string {

    const messageHash =  ethers.solidityPackedKeccak256(
        ["address", "address", "address", "bytes", "uint256"],
        [GasStationFactoryContractAddress, eoa, target, data, nonce]
    );

    const signature = ownerAccount.sign(messageHash).signature;

    return signature
}

function generateOwnerDeploySignature(eoa: string, nonce: number): string {

    const deployMessageHash =  ethers.solidityPackedKeccak256(
        ["address", "address", "uint256"],
        [GasStationFactoryContractAddress, eoa, nonce]
      );

    const signature = ownerAccount.sign(deployMessageHash).signature;

    return signature
}

function generateEoaSignature(machineAddress: string, target: string, data: string, nonce: number): string {

    const eoaMessageHash =  ethers.solidityPackedKeccak256(
        ["address", "address", "bytes", "uint256"],
        [machineAddress, target, data, nonce]
      );

    const signature = eoaAccount.sign(eoaMessageHash).signature;

    return signature
}

async function submitDeployMachineSmartAccountTx() {
    const eoa = '0xEOAAddress'; // Replace with actual EOA (machine owner) address - EOA == "Externally Owned Address"
        const nonce = 1; // Example nonce

    const deploySignature = generateOwnerDeploySignature(eoa, nonce)
    machineAddress = await deployMachineSmartAccount(eoa, nonce, deploySignature);

}

async function submitGetRealStorageTx() {
    try {
        const nonce = 1; // Example nonce
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
        

        const eoaSignature = generateEoaSignature(machineAddress, target, calldata, nonce)
        const ownerSignature = generateOwnerSignature(target, calldata, nonce)

        await executeTransaction(target, calldata, nonce, ownerSignature,);
    } catch (error) {
        console.error('Error:', error);
    }

}

async function submitMachineStorageTx() {
    try {
        const eoa = '0xEOAAddress'; // Replace with actual EOA (machine owner) address - EOA == "Externally Owned Address"
        const nonce = 1; // Example nonce
        const target = '0x0000000000000000000000000000000000000801'; // Replace with the target contract address

        const abiCoder = new AbiCoder()

        const addItemFunctionSignature = "addItem(bytes,bytes)";
        const addItemFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(addItemFunctionSignature)).substring(0, 10);

        let now = new Date().getTime();

        const itemType = "pqdemo_item_type-" + now
        const itemTypeHex = ethers.hexlify(ethers.toUtf8Bytes(itemType));
        const item = "peaq demo item storage"
        const itemHex = ethers.hexlify(ethers.toUtf8Bytes(item));

        const params = abiCoder.encode(
            ["bytes", "bytes"],
            [itemTypeHex, itemHex]
        );

        const calldata = params.replace("0x", addItemFunctionSelector);
        

        const eoaSignature = generateEoaSignature(machineAddress, target, calldata, nonce)
        const ownerSignature = generateOwnerSignatureForMachineTx(eoa, target, calldata, nonce)

        await executeMachineTransaction(eoa, machineAddress, target, calldata, nonce, ownerSignature, eoaSignature);
    } catch (error) {
        console.error('Error:', error);
    }
}

const generateDIDHash = async () => {
    const customFields = {
      prefix: 'peaq',
      controller: '5FEw7aWmqcnWDaMcwjKyGtJMjQfqYGxXmDWKVfcpnEPmUM7q',
      verifications: [
        {
          type: 'Ed25519VerificationKey2020'
        }
      ],
      signature: {
        type: 'Ed25519VerificationKey2020',
        issuer: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg',
        hash: '0x12345' // replace with your issuer signature
      },
      services: [
        {
          id: '#emailSignature',
          type: 'emailSignature',
          data: '0e816a00d228a6d215542334e51a01eb3280d202fe2324abe75bb8b4acaec4207cc00106e830d493603305f797706a0ef1952c44ea9f9b44c0b3ccc3d4bc758b' // replace with your email signature
        },
      ]
    }

    const did_hash = await Sdk.generateDidDocument({ address: "5FEw7aWmqcnWDaMcwjKyGtJMjQfqYGxXmDWKVfcpnEPmUM7q", customDocumentFields: customFields });
    return did_hash;
  };

async function submitDIDTx() {
    try {
        const eoa = '0xEOAAddress'; // Replace with actual EOA (machine owner) address - EOA == "Externally Owned Address"
        const nonce = 1; // Example nonce
        const target = '0x0000000000000000000000000000000000000800'; // target contract address - DID contract address

        const abiCoder = new AbiCoder()

        const addAttributeFunctionSignature = "addAttribute(address,bytes,bytes,uint32)";
        const createDidFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(addAttributeFunctionSignature)).substring(0, 10);

        let now = new Date().getTime();

        const didAddress = "5FEw7aWmqcnWDaMcwjKyGtJMjQfqYGxXmDWKVfcpnEPmUM7q";
        const didAddressHex = decodeSubstrateAddress(didAddress);
        const didName = `did:peaq:${didAddress}#test`
        const name = ethers.hexlify(ethers.toUtf8Bytes(didName));

        const value = (await generateDIDHash()).value;

        // converted the original did value to bytes and then hex to retain the original value during decoding
        const didVal = ethers.keccak256(ethers.toUtf8Bytes(value));

        const validityFor = 0;

        const params = abiCoder.encode(
        ["address", "bytes", "bytes", "uint32"],
        [didAddressHex, name, didVal, validityFor]
        );

        const calldata = params.replace("0x", createDidFunctionSelector);

        
        const eoaSignature = generateEoaSignature(machineAddress, target, calldata, nonce);
        const ownerSignature = generateOwnerSignatureForMachineTx(eoa, target, calldata, nonce);

        await executeMachineTransaction(eoa, machineAddress, target, calldata, nonce, ownerSignature, eoaSignature);
    } catch (error) {
        console.error('Error:', error);
    }
}

function decodeSubstrateAddress(ss58Address: string): string {
    const publicKeyU8a = decodeAddress(ss58Address);
    const publicKeyHex = u8aToHex(publicKeyU8a);

    return publicKeyHex;
}


// Example usage
(async () => {

    await submitDeployMachineSmartAccountTx();
    await submitMachineStorageTx();
    await submitDIDTx();

    // Submit tx that doesn't require the machine smart account to trigger the target call
    await submitGetRealStorageTx();

    
})();