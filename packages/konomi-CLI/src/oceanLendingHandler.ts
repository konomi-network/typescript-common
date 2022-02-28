import Web3 from 'web3';
import { OptionValues } from 'commander';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/erc20Token';
import { OToken } from '../../ocean-lending/src/oToken';
import { Comptroller } from '../../ocean-lending/src/comptroller';
import { ONE_ETHER } from '../../ocean-lending/src/utils';
import { PriceOracle } from '../../ocean-lending/src/priceOracle';
import logger from './logger';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../../ocean-lending/src/utils';

export async function enterMarkets(account: Account, markets: string[], comptroller: Comptroller, confirmations = 3) {
    await comptroller.enterMarkets(markets, { confirmations: confirmations });

    const liquidity: number = await comptroller.getAccountLiquidity(account.address);
    logger.info('enterMarkets: You have %o of LIQUID assets (worth of USD) pooled in the protocol.', liquidity);

    const konoCollateralFactor: number = await comptroller.markets(markets[0]);
    logger.info('enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol as oKONO.', konoCollateralFactor);
}

export async function borrow(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller, underlyingToBorrow: number, confirmations = 3) {
    const liquidity: number = await comptroller.getAccountLiquidity(account.address);
    if (liquidity.valueOf() <= 0) {
        logger.error("You don't have any liquid assets pooled in the protocol.");
    }

    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    const borrowBalanceBefore = await oToken.borrowBalanceCurrent(account.address);
    if (oTokenBefore.valueOf() <= BigInt(0)) {
        logger.error("You don't have any KONO as collateral.");
    }
    logger.info('erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o', erc20Before, oTokenBefore, borrowBalanceBefore);
    logger.warn('NEVER borrow near the maximum amount because your account will be instantly liquidated.')

    const underlyingDecimals = 18;
    const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
    await oToken.borrow(scaledUpBorrowAmount, { confirmations: confirmations });
    await oToken.approve(scaledUpBorrowAmount, { confirmations: confirmations });
    const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    logger.info('erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o', erc20After, oTokenAfter, borrowBalanceAfter);
}

export async function repay(account: Account, oToken: OToken, token: ERC20Token, amount: number, confirmations = 3) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    const borrowBalanceBefore = await oToken.borrowBalanceCurrent(account.address);
    logger.info('erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o', erc20Before, oTokenBefore, borrowBalanceBefore);
    if (borrowBalanceBefore <= 0) {
        logger.error('invalid borrow balance to repay, expected more than zero')
    }
    if (amount > borrowBalanceBefore) {
        logger.error('the repayment amount exceeds the borrow balance')
    }

    const repayAmount = BigInt(amount) * ONE_ETHER;
    await oToken.repayBorrow(BigInt(repayAmount), { confirmations: confirmations });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
    logger.info('erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o', erc20After, oTokenAfter, borrowBalanceAfter);
}

export async function repayAll(account: Account, oToken: OToken, token: ERC20Token, confirmations = 3) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    const borrowBalanceBefore = await oToken.borrowBalanceCurrent(account.address);
    logger.info('erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o', erc20Before, oTokenBefore, borrowBalanceBefore);
    logger.info('total borrow balance to repay is: %o', borrowBalanceBefore);
    if (borrowBalanceBefore <= 0) {
        logger.error('invalid borrow balance to repay, expected more than zero')
    }

    await oToken.repayBorrow(BigInt(borrowBalanceBefore), { confirmations: confirmations });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
    logger.info('erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o', erc20After, oTokenAfter, borrowBalanceAfter);
}

export async function deposit(account: Account, oToken: OToken, token: ERC20Token, amount: number, confirmations = 3) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    logger.info('erc20Before: %o, oTokenBefore: %o', erc20Before, oTokenBefore);

    const depositAmount = BigInt(amount) * ONE_ETHER;
    await oToken.mint(depositAmount, { confirmations: confirmations });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
}

export async function redeem(account: Account, oToken: OToken, token: ERC20Token, amount: number, confirmations = 3) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    const oTokenToRedeem = BigInt(amount) * BigInt(Math.pow(10, oToken.parameters.decimals));
    logger.info('erc20Before: %o, oToken minted: %o, oToken to redeem: %o', erc20Before, oTokenBefore, oTokenToRedeem);

    await oToken.redeem(oTokenToRedeem, { confirmations: confirmations });
    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
}

export async function redeemAll(account: Account, oToken: OToken, token: ERC20Token, confirmations = 3) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    logger.info('erc20Before: %o, oToken minted: %o, oToken to redeem: %o', erc20Before, oTokenBefore, oTokenBefore);

    await oToken.redeem(oTokenBefore, { confirmations: confirmations });
    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
}

/**
 * parse OceanLending Configuration json file.
 */
export async function parseOceanLendingConfiguration(options: OptionValues) {
    const config = readJsonSync(options.configPath);

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let account: Account;
    if (config.encryptedAccountJson) {
        const pw = await readPassword();
        account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
        account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
        logger.error('Cannot setup account');
        throw Error("Cannot setup account");
    }

    logger.info('Using account: %o', account.address);

    // load the oToken object
    const oTokenAbi = readJsonSync(options.oToken);
    const oToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.oKono.address,
        account,
        config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    const erc20Abi = readJsonSync(options.erc20);
    const token = new ERC20Token(
        web3,
        erc20Abi,
        oToken.parameters.underlying,
        account
    );

    const comptrollerAbi = readJsonSync(options.comptroller);
    const comptroller = new Comptroller(
        web3,
        comptrollerAbi,
        oToken.parameters.comptroller,
        account
    );

    // load price feed object
    const priceOracleAbi = readJsonSync(options.priceOracle);
    const priceOracle = new PriceOracle(web3, priceOracleAbi, config.priceOracle, account);

    return [account, oToken, token, comptroller, config, priceOracle] as const;
}
