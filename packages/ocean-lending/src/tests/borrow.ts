import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { Comptroller } from '../comptroller';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../utils';
import { enterMarkets, borrow, repayBorrow } from './borrowUtils';

async function main() {
    const config = readJsonSync('./config/config.json');

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let account: Account;
    if (config.encryptedAccountJson) {
        const pw = await readPassword();
        account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
        account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
        throw Error("Cannot setup account");
    }

    console.log("Using account:", account.address);

    // load the oToken object
    const oTokenAbi = readJsonSync('./config/oToken.json');
    const oToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.oKono.address,
        account,
        config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    const erc20Abi = readJsonSync('./config/erc20.json');
    const erc20Token = new ERC20Token(
        web3,
        erc20Abi,
        oToken.parameters.underlying,
        account
    );

    const comptrollerAbi = readJsonSync('./config/comptroller.json');
    const comptroller = new Comptroller(
        web3,
        comptrollerAbi,
        oToken.parameters.comptroller,
        account
    );

    // actual tests
    await enterMarkets(account, config.oTokens.oKono.address, comptroller);
    await borrow(account, oToken, erc20Token);
    await repayBorrow(account, oToken, erc20Token);
}

main().then(() => exit(0)).catch((e) => { console.log(e); exit(1); });