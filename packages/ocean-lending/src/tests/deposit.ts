import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../utils';

async function depositWorks(account: Account, oToken: OToken, token: ERC20Token) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);

    const amount = BigInt(1000) * ONE_ETHER;
    await oToken.mint(amount, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    const expectedErc = erc20Before.valueOf() - amount;
    ensure(
        erc20After == expectedErc,
        `invalid erc20 balance, expected ${expectedErc}, actual: ${erc20After}`
    );

    ensure(oTokenAfter > oTokenBefore, "invalid deposit balance");
    // oToken.convertFromUnderlying(amount);
}

/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
async function redeemNoBorrow(account: Account, oToken: OToken, token: ERC20Token) {
    const amount = BigInt(1000) * ONE_ETHER;
    // await oToken.mint(amount, { confirmations: 3 });    

    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);

    await oToken.redeem(oTokenBefore, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    ensure(
        erc20Before < erc20After,
        `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`
    );

    ensure(oTokenAfter.valueOf() === BigInt(0), "invalid deposit balance");
    // oToken.convertFromUnderlying(amount);
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
    // await depositWorks(account, oToken, erc20Token);
    await redeemNoBorrow(account, oToken, erc20Token);
}

main().then(() => exit(0)).catch((e) => { console.log(e); exit(1); });