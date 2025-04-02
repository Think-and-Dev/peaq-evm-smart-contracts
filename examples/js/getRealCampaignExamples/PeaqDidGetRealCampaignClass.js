"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
var sdk_1 = require("@peaq-network/sdk");
var keyring_1 = require("@polkadot/keyring");
var util_1 = require("@polkadot/util");
var util_crypto_1 = require("@polkadot/util-crypto");
var axios_1 = require("axios");
// Import the contract ABI
var MachineStationFactoryABI_json_1 = require("../MachineStationFactoryABI.json");
// peaq RPC URL: https://peaq.api.onfinality.io/public
var rpcURL = "https://erpc-async.agung.peaq.network"; // replace with peaq RPC URL during mainnet deployment. 
var chainID = 3338;
// Contract details
// Replace with the your dedicated machine station factory contract address during deployment
var MachineStationFactoryContractAddress = '0x7330dbE35b346B14E93842Ab7Fb0AE0963f85b8E';
var contract = new ethers_1.ethers.ContractFactory(MachineStationFactoryABI_json_1.abi, MachineStationFactoryContractAddress);
var abiCoder = new ethers_1.AbiCoder();
// Wallet details
var ownerPrivateKey = (_a = process.env.CONTRACT_OWNER_PRIVATE_KEY) !== null && _a !== void 0 ? _a : ""; // Replace with owner wallet's private key
var machineOwnerPrivateKey = (_b = process.env.MACHINE_OWNER_PRIVATE_KEY) !== null && _b !== void 0 ? _b : ""; // Replace with machine owner wallet's private key
var provider = new ethers_1.ethers.JsonRpcProvider(rpcURL);
var ownerAccount = new ethers_1.ethers.Wallet(ownerPrivateKey, provider);
var machineOwnerAccount = new ethers_1.ethers.Wallet(machineOwnerPrivateKey, provider);
var DEPIN_SEED = "major wish sketch invite evolve ribbon stay soccer rebuild record merit popular"; // The seed phrase for DePIN Project, used for signing the DID
var PEAQ_SERVICE_URL = "https://lift-off-campaign-service-jx-devbr.jx.peaq.network"; // URL to the peaq campaign service 
// dev URL: https://lift-off-campaign-service-jx-devbr.jx.peaq.network
var API_KEY = "aa69cb8e92b2e27eb26996fc9b02f6df24"; // peaq campaign service APIKEY value added to the header of all requests
// dev APIKEY: aa69cb8e92b2e27eb26996fc9b02f6df24
// production APIKEY will be sent to you after deployment
var PROJECT_API_KEY = "all_0821fcaa69"; // peaq campaign service unique APIKEY value for specific project added to the header of all requests
// dev P-APIKEY: all_0821fcaa69
// your production P-APIKEY will be sent to you after deployment
var PeaqGetRealCampaignClass = /** @class */ (function () {
    function PeaqGetRealCampaignClass() {
    }
    PeaqGetRealCampaignClass.prototype.deployMachineSmartAccount = function (machineOwner, nonce, signature) {
        return __awaiter(this, void 0, void 0, function () {
            var methodData, txResponse, receipt, logs, eventSignature_1, log, rawDeployedAddress, deployedAddress, error_1, iface, decodedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        methodData = contract.interface.encodeFunctionData("deployMachineSmartAccount", [machineOwner, nonce, signature]);
                        return [4 /*yield*/, this.sendTransaction(methodData)];
                    case 1:
                        txResponse = _a.sent();
                        return [4 /*yield*/, txResponse.wait().finally()];
                    case 2:
                        receipt = _a.sent();
                        logs = receipt === null || receipt === void 0 ? void 0 : receipt.logs;
                        eventSignature_1 = ethers_1.ethers.id("MachineSmartAccountDeployed(address)");
                        console.log("eventSignature: ", eventSignature_1);
                        log = logs === null || logs === void 0 ? void 0 : logs.find(function (log) { return log.topics[0] === eventSignature_1; });
                        console.log("raw log: ", log);
                        if (!log) {
                            throw new Error("MachineSmartAccountDeployed event not found in logs");
                        }
                        rawDeployedAddress = log.topics[1];
                        deployedAddress = ethers_1.ethers.getAddress("0x".concat(rawDeployedAddress.slice(26)));
                        console.log('Machine Deploy Tx executed:', receipt === null || receipt === void 0 ? void 0 : receipt.hash);
                        console.log("Machine Deployed Address:", deployedAddress);
                        return [2 /*return*/, deployedAddress];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Transaction failed. Error:", error_1);
                        // Check if the error is a revert error with data
                        if (error_1.data) {
                            try {
                                iface = new ethers_1.ethers.Interface(contract.interface.fragments);
                                decodedError = iface.parseError(error_1.data);
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
                            }
                            catch (decodeError) {
                                console.error("Failed to decode error data:", decodeError);
                            }
                        }
                        else {
                            console.error("Transaction failed without revert data:", error_1);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, ""];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.submitDIDTx = function () {
        return __awaiter(this, void 0, void 0, function () {
            var machineOwner, nonce, target, deploySignature, machineAddress, addAttributeFunctionSignature, createDidFunctionSelector, keyPair, DIDSubjectPair, DIDAddress, postdata, emailSignature, didName, name_1, value, didVal, validityFor, params, calldata, machineOwnerSignature, ownerSignature, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        machineOwner = machineOwnerAccount.address;
                        nonce = this.getRandomNonce();
                        target = "0x0000000000000000000000000000000000000800";
                        return [4 /*yield*/, this.ownerSignTypedDataDeployMachineSmartAccount(machineOwner, nonce)];
                    case 1:
                        deploySignature = _a.sent();
                        return [4 /*yield*/, this.deployMachineSmartAccount(machineOwner, nonce, deploySignature)];
                    case 2:
                        machineAddress = _a.sent();
                        if (machineAddress.length < 42)
                            throw new Error("invalid machine address");
                        addAttributeFunctionSignature = "addAttribute(address,bytes,bytes,uint32)";
                        createDidFunctionSelector = ethers_1.ethers
                            .keccak256(ethers_1.ethers.toUtf8Bytes(addAttributeFunctionSignature))
                            .substring(0, 10);
                        return [4 /*yield*/, this.generateNewDidAddress()];
                    case 3:
                        keyPair = (_a.sent()).keyPair;
                        DIDSubjectPair = keyPair;
                        DIDAddress = DIDSubjectPair.address;
                        postdata = {
                            email: "<EMAIL>",
                            did_address: DIDAddress,
                            tag: "<YOUR_CUSTOM_TASK_TAG>" // replace with your unique custom task tag
                        };
                        return [4 /*yield*/, this.createEmailSignature(postdata)];
                    case 4:
                        emailSignature = _a.sent();
                        didName = "did:peaq:".concat(machineAddress, "#test");
                        name_1 = ethers_1.ethers.hexlify(ethers_1.ethers.toUtf8Bytes(didName));
                        return [4 /*yield*/, this.generateDIDHash(machineOwner, DIDAddress, emailSignature)];
                    case 5:
                        value = _a.sent();
                        didVal = ethers_1.ethers.hexlify(ethers_1.ethers.toUtf8Bytes(value));
                        validityFor = 0;
                        params = abiCoder.encode(["address", "bytes", "bytes", "uint32"], [machineAddress, name_1, didVal, validityFor]);
                        calldata = params.replace("0x", createDidFunctionSelector);
                        return [4 /*yield*/, this.machineOwnerSignTypedDataExecuteMachine(machineAddress, target, calldata, nonce)];
                    case 6:
                        machineOwnerSignature = _a.sent();
                        return [4 /*yield*/, this.ownerSignTypedDataExecuteMachineTransaction(machineAddress, target, calldata, nonce)];
                    case 7:
                        ownerSignature = _a.sent();
                        return [4 /*yield*/, this.executeMachineTransaction(machineAddress, target, calldata, nonce, ownerSignature, machineOwnerSignature)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        error_2 = _a.sent();
                        console.error("Error:", error_2);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.executeMachineTransaction = function (machineAddress, target, data, nonce, signature, machineOwnerSignature) {
        return __awaiter(this, void 0, void 0, function () {
            var methodData, txResponse, receipt, error_3, iface, decodedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        methodData = contract.interface.encodeFunctionData("executeMachineTransaction", [machineAddress, target, data, nonce, signature, machineOwnerSignature]);
                        return [4 /*yield*/, this.sendTransaction(methodData)];
                    case 1:
                        txResponse = _a.sent();
                        return [4 /*yield*/, txResponse.wait().finally()];
                    case 2:
                        receipt = _a.sent();
                        console.log('Machine Tx executed:', receipt === null || receipt === void 0 ? void 0 : receipt.hash);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Transaction failed. Error:", error_3);
                        // Check if the error is a revert error with data
                        if (error_3.data) {
                            try {
                                iface = new ethers_1.ethers.Interface(contract.interface.fragments);
                                decodedError = iface.parseError(error_3.data);
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
                            }
                            catch (decodeError) {
                                console.error("Failed to decode error data:", decodeError);
                            }
                        }
                        else {
                            console.error("Transaction failed without revert data:", error_3);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.ownerSignTypedDataDeployMachineSmartAccount = function (machineOwner, nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var domain, types, message, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        domain = {
                            name: "MachineStationFactory",
                            version: "1",
                            chainId: chainID,
                            verifyingContract: MachineStationFactoryContractAddress,
                        };
                        types = {
                            DeployMachineSmartAccount: [
                                { name: "machineOwner", type: "address" },
                                { name: "nonce", type: "uint256" },
                            ],
                        };
                        message = {
                            machineOwner: machineOwner,
                            nonce: nonce,
                        };
                        return [4 /*yield*/, ownerAccount.signTypedData(domain, types, message)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.machineOwnerSignTypedDataExecuteMachine = function (machineAddress, target, data, nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var domain, types, message, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        domain = {
                            name: "MachineSmartAccount",
                            version: "1",
                            chainId: chainID,
                            verifyingContract: machineAddress,
                        };
                        types = {
                            Execute: [
                                { name: "target", type: "address" },
                                { name: "data", type: "bytes" },
                                { name: "nonce", type: "uint256" },
                            ],
                        };
                        message = {
                            target: target,
                            data: data,
                            nonce: nonce,
                        };
                        return [4 /*yield*/, machineOwnerAccount.signTypedData(domain, types, message)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.ownerSignTypedDataExecuteMachineTransaction = function (machineAddress, target, data, nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var domain, types, message, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        domain = {
                            name: "MachineStationFactory",
                            version: "1",
                            chainId: chainID,
                            verifyingContract: MachineStationFactoryContractAddress,
                        };
                        types = {
                            ExecuteMachineTransaction: [
                                { name: "machineAddress", type: "address" },
                                { name: "target", type: "address" },
                                { name: "data", type: "bytes" },
                                { name: "nonce", type: "uint256" },
                            ],
                        };
                        message = {
                            machineAddress: machineAddress,
                            target: target,
                            data: data,
                            nonce: nonce,
                        };
                        return [4 /*yield*/, ownerAccount.signTypedData(domain, types, message)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                }
            });
        });
    };
    // Helper function to sign and send transactions
    PeaqGetRealCampaignClass.prototype.sendTransaction = function (methodData) {
        return __awaiter(this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = {
                            to: MachineStationFactoryContractAddress,
                            data: methodData,
                        };
                        return [4 /*yield*/, ownerAccount.sendTransaction(tx)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PeaqGetRealCampaignClass.prototype.getRandomNonce = function () {
        var now = BigInt(Date.now());
        var randomPart = BigInt(Math.floor(Math.random() * 1e18));
        return now * randomPart;
    };
    PeaqGetRealCampaignClass.prototype.generateDIDHash = function (machineOwnerAddress, didAddress, emailSignature) {
        return __awaiter(this, void 0, void 0, function () {
            var keyring, DePinPair, issuerSignature, customFields, did_hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keyring = new keyring_1.Keyring({ type: "sr25519" });
                        DePinPair = keyring.addFromUri(DEPIN_SEED);
                        issuerSignature = (0, util_1.u8aToHex)(DePinPair.sign((0, util_1.stringToU8a)(didAddress)));
                        customFields = {
                            prefix: 'peaq',
                            controller: '5FEw7aWmqcnWDaMcwjKyGtJMjQfqYGxXmDWKVfcpnEPmUM7q',
                            signature: {
                                type: 'Ed25519VerificationKey2020',
                                issuer: DePinPair === null || DePinPair === void 0 ? void 0 : DePinPair.address,
                                hash: issuerSignature
                            },
                            services: [
                                {
                                    id: '#emailSignature',
                                    type: 'emailSignature',
                                    data: emailSignature
                                },
                                {
                                    id: '#owner',
                                    type: 'owner',
                                    data: machineOwnerAddress
                                },
                            ]
                        };
                        return [4 /*yield*/, sdk_1.Sdk.generateDidDocument({ address: didAddress, customDocumentFields: customFields })];
                    case 1:
                        did_hash = _a.sent();
                        return [2 /*return*/, did_hash.value];
                }
            });
        });
    };
    ;
    PeaqGetRealCampaignClass.prototype.generateNewDidAddress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mnemonic, keyring, keyPair;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, util_crypto_1.cryptoWaitReady)()];
                    case 1:
                        _a.sent();
                        mnemonic = (0, util_crypto_1.mnemonicGenerate)();
                        keyring = new keyring_1.Keyring({ type: 'sr25519' });
                        keyPair = keyring.addFromMnemonic(mnemonic);
                        console.log('Generated Address:', keyPair.address);
                        return [2 /*return*/, {
                                keyPair: keyPair,
                                mnemonic: mnemonic,
                                address: keyPair.address,
                            }];
                }
            });
        });
    };
    // Function to create email signature
    PeaqGetRealCampaignClass.prototype.createEmailSignature = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("".concat(PEAQ_SERVICE_URL, "/v1/sign"), data, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'APIKEY': API_KEY,
                                    'P-APIKEY': PROJECT_API_KEY
                                }
                            })
                                .then(function (response) {
                                return response.data;
                            })
                                .catch(function (err) {
                                console.error(err);
                                throw err;
                            })];
                    case 1:
                        response = _a.sent();
                        // Note: You may need to adjust the response handling based on the service's response structure
                        return [2 /*return*/, response.data.signature];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error creating email signature", error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ;
    return PeaqGetRealCampaignClass;
}());
// Main function to create DID
var createDid = function () { return __awaiter(void 0, void 0, void 0, function () {
    var campaignClass, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                campaignClass = new PeaqGetRealCampaignClass();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, campaignClass.submitDIDTx()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.error("DID Creation Error:", error_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
createDid().catch(console.error);
