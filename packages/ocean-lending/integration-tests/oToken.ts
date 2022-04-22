import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../src/clients/erc20Token';
import { OToken } from '../src/clients/oToken';
import { Comptroller } from '../src/clients/comptroller';
import { ensure, ONE_ETHER, sleep } from '../src/utils';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from "../src/reading"
import { PriceOracleAdaptor } from '../src/clients/priceOracle';


async function repayBorrow(account: Account, oToken: OToken, token: ERC20Token) {
    console.log('==== repayBorrow ====');
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    console.log('erc20Before:', erc20Before, ' oTokenBefore:', oTokenBefore);

    const balance = await oToken.accountBorrowBalance(account.address);
    console.log(`borrow balance to repay ${Number(balance) / 1e18}`);
    ensure(balance > BigInt(0), 'invalid borrow balance to repay, expected more than zero');

    await oToken.repayBorrow(Web3.utils.toHex(balance.toString()), { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    console.log('erc20After:', erc20After, ' oTokenAfter:', oTokenAfter);

    ensure(
        erc20Before > erc20After,
        `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`
    );
}

async function borrowInterest(account: Account, oToken: OToken, token: ERC20Token) {
    console.log('==== borrowInterest begin ====');
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    const borrowBalanceBefore = await oToken.accountBorrowBalance(account.address);
    const borrowAmount = Number(ONE_ETHER) * 100;
    console.log(`erc20Before: ${erc20Before}, oTokenBefore: ${oTokenBefore}, borrowBalanceBefore: ${borrowBalanceBefore}, amount to borrow: ${borrowAmount}`);

    await oToken.borrow(borrowAmount.toString(), { confirmations: 3 });
    // waiting for a while causes interest to accrue
    await sleep(1000);

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    const borrowBalanceAfter = await oToken.accountBorrowBalance(account.address);
    console.log(`erc20After: ${erc20After}, oTokenAfter: ${oTokenAfter}, borrowBalanceAfter: ${borrowBalanceAfter}, borrowInterest: ${borrowInterest}`);
    console.log('==== borrowInterest end ====');
}

describe('Borrow', () => {
    const config = readJsonSync('./config/config.json');
    const oTokenAbi = readJsonSync('./config/oToken.json');
    const erc20Abi = readJsonSync('./config/erc20.json');
    const comptrollerAbi = readJsonSync('./config/comptroller.json');
    const priceOracleAbi = readJsonSync('./config/priceOracle.json');

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let account: Account;
    let oToken: OToken;
    let erc20Token: ERC20Token;
    let comptroller: Comptroller;
    let priceOracle: PriceOracleAdaptor;

    beforeAll(async () => {
        if (config.encryptedAccountJson) {
            const pw = await readPassword();
            account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
        } else if (config.privateKey) {
            account = loadWalletFromPrivate(config.privateKey, web3);
        } else {
            throw Error('Cannot setup account');
        }

        console.log('Using account:', account.address);

        // load the oToken object
        oToken = new OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);

        // load the erc20 token object
        erc20Token = new ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);

        comptroller = new Comptroller(web3, comptrollerAbi, oToken.parameters.comptroller, account);

        // load price feed object
        priceOracle = new PriceOracleAdaptor(web3, priceOracleAbi, config.priceOracle.address, account);
    });

    it('key flow test', async () => {
        const markets = [config.oTokens.oKono.address];
        await enterMarkets(account, markets, comptroller);
        await borrow(account, oToken, erc20Token, priceOracle, comptroller, 50);
        await repayBorrow(account, oToken, erc20Token);
    });

    it('borrow interest', async () => {
        await borrowInterest(account, oToken, erc20Token);
    });

});
