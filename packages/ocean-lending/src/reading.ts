import * as fs from 'fs';
import Web3 from 'web3';
import { Account } from 'web3-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJsonSync(path: string): any {
  const rawdata = fs.readFileSync(path);
  return JSON.parse(rawdata.toString());
}

/**
 * Load wallet from the encrypted json
 * @param json The path to the json file stored locally
 * @param password The password
 * @param web3 The web3 instance
 */
export function loadWalletFromEncyrptedJson(json: string, password: string, web3: Web3) {
  const walletEncryptedJson = JSON.parse(fs.readFileSync(json).toString());

  const account = web3.eth.accounts.decrypt(walletEncryptedJson, password);
  web3.eth.accounts.wallet.add(account);

  return account;
}

/**
 * Load wallet from the private key
 * @param privateKey The private key
 * @param web3 The web3 instance
 */
export function loadWalletFromPrivate(privateKey: string, web3: Web3): Account {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  return account;
}

export function readPassword(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.stdoutMuted = true;

  const p: Promise<string> = new Promise((resolve) => {
    rl.question('Password: ', function (password: string) {
      rl.close();
      console.log('\n');
      resolve(password);
    });
  });

  rl._writeToOutput = function writeToOutput(stringToWrite: string) {
    if (rl.stdoutMuted) rl.output.write('*');
    else rl.output.write(stringToWrite);
  };

  rl.history = rl.history.slice(1);

  return p;
}