"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBitSet = exports.ensure = exports.ONE_ETHER = exports.readPassword = exports.loadWalletFromPrivate = exports.loadWalletFromEncyrptedJson = exports.readJsonSync = void 0;
const fs = __importStar(require("fs"));
function readJsonSync(path) {
    let rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata.toString());
}
exports.readJsonSync = readJsonSync;
/**
 * Load wallet from the encrypted json
 * @param json The path to the json file stored locally
 * @param password The password
 * @param web3 The web3 instance
 */
function loadWalletFromEncyrptedJson(json, password, web3) {
    const walletEncryptedJson = JSON.parse(fs.readFileSync(json).toString());
    const account = web3.eth.accounts.decrypt(walletEncryptedJson, password);
    web3.eth.accounts.wallet.add(account);
    return account;
}
exports.loadWalletFromEncyrptedJson = loadWalletFromEncyrptedJson;
/**
 * Load wallet from the private key
 * @param privateKey The private key
 * @param web3 The web3 instance
 */
function loadWalletFromPrivate(privateKey, web3) {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    return account;
}
exports.loadWalletFromPrivate = loadWalletFromPrivate;
function readPassword() {
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.stdoutMuted = true;
    const p = new Promise((resolve) => {
        rl.question('Password: ', function (password) {
            rl.close();
            console.log("\n");
            resolve(password);
        });
    });
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (rl.stdoutMuted)
            rl.output.write("*");
        else
            rl.output.write(stringToWrite);
    };
    rl.history = rl.history.slice(1);
    return p;
}
exports.readPassword = readPassword;
exports.ONE_ETHER = BigInt("1000000000000000000");
function ensure(predicate, errorMessage) {
    if (!predicate) {
        throw new Error(errorMessage);
    }
}
exports.ensure = ensure;
function isBitSet(n, offset) {
    return (n >> offset & 1) === 1;
}
exports.isBitSet = isBitSet;
//# sourceMappingURL=utils.js.map