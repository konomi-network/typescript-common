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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const logger_1 = __importDefault(require("../logger"));
const PENDING = "pending";
/**
 * The client class for Konomi Protocol.
 */
class Client {
    constructor(web3, abi, address, account) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(abi, address);
        this.account = account;
    }
    connect(account) {
        this.account = account;
    }
    /**
     * Get token address from contract
     * @returns The token address
     */
    get address() {
        return this.contract.options.address;
    }
    /**
     * Prepare the txn data for payable methods.
     * @param method The method object
     * @returns The prepared txn data.
     */
    prepareTxn(method) {
        return __awaiter(this, void 0, void 0, function* () {
            const txn = {
                from: this.account.address,
                nonce: yield this.deduceNonce(),
            };
            txn.gas = yield this.estimateGas(method, txn);
            return txn;
        });
    }
    send(method, txn, options, receiptCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                method
                    .send(txn)
                    .once("transactionHash", (txnHash) => __awaiter(this, void 0, void 0, function* () {
                    logger_1.default.info("transaction hash for method: %o is %o", method, txnHash);
                }))
                    .on("confirmation", (confirmations, receipt, latestBlockHash) => {
                    logger_1.default.debug("confirmations: %o receipt: %o latestBlockHash: %o", confirmations, receipt, latestBlockHash);
                    if (confirmations === options.confirmations) {
                        if (receiptCallback) {
                            receiptCallback(receipt);
                        }
                        return resolve();
                    }
                })
                    .on("error", (error, receipt) => {
                    logger_1.default.warn("submit for error: %o receipt: %o", error, receipt);
                    return reject(error);
                });
            });
        });
    }
    deduceNonce() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.web3.eth.getTransactionCount(this.account.address, PENDING);
        });
    }
    estimateGas(method, txn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield method.estimateGas(txn);
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map