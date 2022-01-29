import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../utils';

async function borrowWorks(account: Account, oToken: OToken, token: ERC20Token) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);

    console.log("erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);

    const amount = BigInt(1000) * ONE_ETHER;
    await oToken.borrow(amount, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

    ensure(
        erc20After == erc20Before,
        `invalid erc20 balance, expected ${erc20Before}, actual: ${erc20After}`
    );

    ensure(oTokenAfter == oTokenBefore, "invalid borrow balance");
    // oToken.convertFromUnderlying(amount);
}

async function repayBorrow(account: Account, oToken: OToken, token: ERC20Token) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);

    console.log("erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);

    await oToken.repayBorrow(oTokenBefore, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

    ensure(
        erc20Before > erc20After,
        `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`
    );
}

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

    // actual tests
    await borrowWorks(account, oToken, erc20Token);
    await repayBorrow(account, oToken, erc20Token);
}

main().then(() => exit(0)).catch((e) => { console.log(e); exit(1); });