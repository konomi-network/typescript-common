import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { Comptroller } from '../comptroller';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../utils';
import { enterMarkets, borrow, repayBorrow } from './borrowUtils';

async function liquidateBorrow(liquidatorAccount: Account, liquidatorOToken: OToken, liquidatorToken: ERC20Token,
    borrowerAccount: Account, borrowerOToken: OToken, borrowerToken: ERC20Token, borrowerComptroller: Comptroller) {
    console.log("==== liquidateBorrow ====");

    {
        const erc20Before = await liquidatorToken.balanceOf(liquidatorAccount.address);
        const oTokenBefore = await liquidatorOToken.balanceOf(liquidatorAccount.address);
        console.log("liquidator erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);
    }

    const erc20Before = await borrowerToken.balanceOf(borrowerAccount.address);
    const oTokenBefore = await borrowerOToken.balanceOf(borrowerAccount.address);
    console.log("borrower erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);

    {
        const liquidity = await borrowerComptroller.getAccountLiquidity(borrowerAccount.address);
        console.log(`You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
    }

    const closeFactor = await borrowerComptroller.liquidationIncentive();
    console.log("borrower closeFactor: ", closeFactor);

    const underlyingToBorrow = 10;
    const underlyingDecimals = 18;
    const repayAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
    await liquidatorOToken.liquidateBorrow(borrowerAccount.address, repayAmount, borrowerOToken.address, { confirmations: 3 });

    {
        const erc20After = await liquidatorToken.balanceOf(liquidatorAccount.address);
        const oTokenAfter = await liquidatorOToken.balanceOf(liquidatorAccount.address);
        console.log("liquidator erc20After:", erc20After, " oTokenAfter:", oTokenAfter);
    }

    const erc20After = await borrowerToken.balanceOf(borrowerAccount.address);
    const oTokenAfter = await borrowerOToken.balanceOf(borrowerAccount.address);
    console.log("borrower erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

    ensure(
        erc20Before == erc20After,
        `invalid erc20 balance, expected ${erc20After} to be equal actual: ${erc20After}`
    );
}

async function main() {
    const config = readJsonSync('./config/config.json');

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let liquidatorAccount: Account;
    let borrowerAccount: Account;
    if (config.encryptedAccountJson) {
        const pw = await readPassword();
        liquidatorAccount = loadWalletFromEncyrptedJson(config.encryptedLiquidatorAccountJson, pw, web3);
        borrowerAccount = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
        liquidatorAccount = loadWalletFromPrivate(config.liquidatorPrivateKey, web3);
        borrowerAccount = loadWalletFromPrivate(config.privateKey, web3);
    } else {
        throw Error("Cannot setup account");
    }

    console.log("Using liquidator account:", liquidatorAccount.address);
    console.log("Using borrower account:", borrowerAccount.address);

    // load the oToken object
    const oTokenAbi = readJsonSync('./config/oToken.json');
    const borrowerOToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.oKono.address,
        borrowerAccount,
        config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    const erc20Abi = readJsonSync('./config/erc20.json');
    const borrowerErc20Token = new ERC20Token(
        web3,
        erc20Abi,
        borrowerOToken.parameters.underlying,
        borrowerAccount
    );

    const comptrollerAbi = readJsonSync('./config/comptroller.json');
    const borrowerComptroller = new Comptroller(
        web3,
        comptrollerAbi,
        borrowerOToken.parameters.comptroller,
        borrowerAccount
    );

    const liquidatorOToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.oKono.address,
        liquidatorAccount,
        config.oTokens.oKono.parameters
    );

    const liquidatorErc20Token = new ERC20Token(
        web3,
        erc20Abi,
        liquidatorOToken.parameters.underlying,
        liquidatorAccount
    );

    // actual tests
    // await enterMarkets(borrowerAccount, config.oTokens.oKono.address, borrowerComptroller);
    // await borrow(borrowerAccount, borrowerOToken, borrowerErc20Token);
    await liquidateBorrow(liquidatorAccount, liquidatorOToken, liquidatorErc20Token,
        borrowerAccount, borrowerOToken, borrowerErc20Token, borrowerComptroller);
    // await repayBorrow(borrowerAccount, borrowerOToken, borrowerErc20Token);
}

main().then(() => exit(0)).catch((e) => { console.log(e); exit(1); });