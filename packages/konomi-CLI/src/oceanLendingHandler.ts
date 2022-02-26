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

export async function enterMarkets(account: Account, markets: string[], comptroller: Comptroller) {
    await comptroller.enterMarkets(markets, { confirmations: 3 });

    const liquidity: number = await comptroller.getAccountLiquidity(account.address);
    logger.info('enterMarkets: You have %o of LIQUID assets (worth of USD) pooled in the protocol.', liquidity);

    const konoCollateralFactor: number = await comptroller.markets(markets[0]);
    logger.info('enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol as oKONO.', konoCollateralFactor);
}

export async function borrow(account: Account, oToken: OToken, token: ERC20Token, priceOracle: PriceOracle, comptroller: Comptroller, underlyingToBorrow: number) {
    const liquidity: number = await comptroller.getAccountLiquidity(account.address);
    if (liquidity.valueOf() <= 0) {
        logger.error("You don't have any liquid assets pooled in the protocol.");
    }

    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);

    const borrowBalanceBefore = await oToken.borrowBalanceCurrent(account.address);
    const konoCollateralFactor: number = await comptroller.markets(oToken.address);
    const exchangeRate = await oToken.exchangeRate();
    const underlyingPrice = await priceOracle.getUnderlyingPrice(oToken.address);

    if (oTokenBefore.valueOf() <= BigInt(0)) {
        logger.error("You don't have any KONO as collateral.");
    }
    logger.info('erc20Before: %o, oTokenBefore: %o, exchangeRate: %o, underlyingPrice: %o', erc20Before, oTokenBefore, exchangeRate / 1e28, underlyingPrice.toFixed(6));
    logger.warn('NEVER borrow near the maximum amount because your account will be instantly liquidated.')

    const underlyingDeposited = (Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals)) * exchangeRate;
    const underlyingBorrowable = (underlyingDeposited * konoCollateralFactor) / 100;
    const underlyingDecimals = 18;
    const toBorrowLiquid = (underlyingToBorrow * underlyingPrice * konoCollateralFactor) / 100;

    logger.info('Borrow balance currently is %o', borrowBalanceBefore / Math.pow(10, underlyingDecimals));
    if (borrowBalanceBefore > underlyingBorrowable) {
        logger.error("Borrow balance exceeded collateral factor.");
    }
    if (toBorrowLiquid >= liquidity) {
        logger.error("Borrowing amount exceed account liquid");
    }

    const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
    await oToken.borrow(scaledUpBorrowAmount, { confirmations: 3 });
    const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
    logger.info('Borrow balance after is %o', borrowBalanceAfter / Math.pow(10, underlyingDecimals));

    await oToken.approve(scaledUpBorrowAmount, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
    if (erc20After <= erc20Before) {
        logger.error("invalid erc20 balance, expected: %o, actual: %o", erc20Before, erc20After);
    }
    if (oTokenAfter !== oTokenBefore) {
        logger.error('invalid borrow balance');
    }
}

export async function repay(account: Account, oToken: OToken, token: ERC20Token, priceOracle: PriceOracle) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    logger.info('erc20Before: %o, oTokenBefore: %o', erc20Before, oTokenBefore);

    const balance = await oToken.borrowBalanceCurrent(account.address);
    logger.info('borrow balance to repay %o', balance / 1e18);
    if (balance <= 0) {
        logger.error('invalid borrow balance to repay, expected more than zero')
    }

    await oToken.repayBorrow(BigInt(balance), { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);

    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
    if (erc20Before <= erc20After) {
        logger.error("invalid erc20 balance, erc20Before expected: %o to be bigger than actual erc20After: %o", erc20Before, erc20After);
    }
}

export async function deposit(account: Account, oToken: OToken, token: ERC20Token, amount: number) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    logger.info('erc20Before: %o, oTokenBefore: %o', erc20Before, oTokenBefore);

    const depositAmount = BigInt(1000) * ONE_ETHER;
    await oToken.mint(depositAmount, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    logger.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);


    const expectedErc = erc20Before.valueOf() - depositAmount;
    if (erc20After != expectedErc) {
        logger.error("invalid erc20 balance, expected erc20After: %o, actual: %o", expectedErc, erc20After);
    }
    if (oTokenAfter <= oTokenBefore) {
        logger.error('invalid borrow balance');
    }
}

/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
export async function redeem(account: Account, oToken: OToken, token: ERC20Token) {
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    logger.info('oToken minted: %o, oToken to redeem: %o', Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals), Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals));

    await oToken.redeem(oTokenBefore, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    if (erc20Before >= erc20After) {
        logger.error('invalid erc20 balance, expected erc20After: %o  to be bigger than erc20Before: %o', Number(erc20After) / 1e18, Number(erc20Before) / 1e18)
    }
    if (oTokenAfter.valueOf() !== BigInt(0)) {
        logger.error('invalid deposit balance');
    }
}

/**
 * The OceanLeningHandler class for CLI's  OceanLending command .
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
        throw Error("Cannot setup account");
        logger.error('Cannot setup account');
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
