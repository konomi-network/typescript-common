"use strict";
exports.__esModule = true;
exports.isBitSet = exports.ensure = exports.ONE_ETHER = exports.readPassword = exports.loadWalletFromPrivate = exports.loadWalletFromEncyrptedJson = exports.readJsonSync = void 0;
var fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readJsonSync(path) {
    var rawdata = fs.readFileSync(path);
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
    var walletEncryptedJson = JSON.parse(fs.readFileSync(json).toString());
    var account = web3.eth.accounts.decrypt(walletEncryptedJson, password);
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
    var account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    return account;
}
exports.loadWalletFromPrivate = loadWalletFromPrivate;
function readPassword() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var readline = require("readline");
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.stdoutMuted = true;
    var p = new Promise(function (resolve) {
        rl.question("Password: ", function (password) {
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
    return ((n >> offset) & 1) === 1;
}
exports.isBitSet = isBitSet;
