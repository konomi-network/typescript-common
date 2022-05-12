import Web3 from 'web3';
import { Command, OptionValues } from 'commander';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/clients/erc20Token';
import { OToken } from '../../ocean-lending/src/clients/oToken';
import { Comptroller } from '../../ocean-lending/src/clients/comptroller';
import logger from './logger';

import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../../ocean-lending/src/reading';
import { TxnOptions } from '../../ocean-lending/src/options';

export interface OceanLendingConfig {
    account: Account,
    borrowedToken: OToken,
    collateralToken: OToken,
    underlyingOfBorrowedToken: ERC20Token,
    underlyingOfCollateralToken: ERC20Token,
    comptroller: Comptroller,
    confirmations: TxnOptions
}

export interface AccountDetail {
    liquidity: number,
    underlyingOfBorrowedToken: string,
    underlyingOfCollateralToken: string,
    borrowedToken: number,
    collateralToken: number,
    borrowBalance: number
}

export async function enterMarkets(oceanLendingConfig: OceanLendingConfig) {
    const markets = [oceanLendingConfig.borrowedToken.address, oceanLendingConfig.collateralToken.address];

    await oceanLendingConfig.comptroller.enterMarkets(markets, oceanLendingConfig.confirmations);

    await getAccountDetail(oceanLendingConfig, "enterMarkets", "after")

    const collateralFactor: number = await oceanLendingConfig.comptroller.collateralFactor(oceanLendingConfig.collateralToken.address);
    logger.info('enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol.', collateralFactor);
}

export async function borrow(oceanLendingConfig: OceanLendingConfig, underlyingToBorrow: string) {
    const accountDetailBefore = await getAccountDetail(oceanLendingConfig, "borrow", "before")
    if (accountDetailBefore.liquidity.valueOf() <= 0) {
        logger.error("You don't have any liquid assets pooled in the protocol.");
    }
    logger.warn('NEVER borrow near the maximum amount because your account will be instantly liquidated.')

    await oceanLendingConfig.borrowedToken.borrow(underlyingToBorrow, oceanLendingConfig.confirmations);

    await getAccountDetail(oceanLendingConfig, "borrow", "after")
}

export async function repay(oceanLendingConfig: OceanLendingConfig, repayAmount: number) {
    const accountDetailBefore = await getAccountDetail(oceanLendingConfig, "repay", "before")
    if (accountDetailBefore.borrowBalance <= 0) {
        logger.error('invalid borrow balance to repay, expected more than zero')
    }
    if (repayAmount > accountDetailBefore.borrowBalance) {
        logger.error('the repayment amount exceeds the borrow balance')
    }
    await oceanLendingConfig.borrowedToken.repayBorrow(repayAmount.toString(), oceanLendingConfig.confirmations);

    await getAccountDetail(oceanLendingConfig, "repay", "after")
}

export async function repayAll(oceanLendingConfig: OceanLendingConfig) {
    const accountDetailBefore = await getAccountDetail(oceanLendingConfig, "repayAll", "before")
    if (accountDetailBefore.borrowBalance <= 0) {
        logger.error('invalid borrow balance to repay, expected more than zero')
    }

    await oceanLendingConfig.borrowedToken.repayBorrow(getNegativeOne(), oceanLendingConfig.confirmations);

    await getAccountDetail(oceanLendingConfig, "repayAll", "after")
}

export async function deposit(oceanLendingConfig: OceanLendingConfig, depositAmount: number) {
    await getAccountDetail(oceanLendingConfig, "deposit", "before")
    await oceanLendingConfig.collateralToken.mint(depositAmount.toString(), oceanLendingConfig.confirmations);
    await getAccountDetail(oceanLendingConfig, "deposit", "after")
}

export async function redeem(oceanLendingConfig: OceanLendingConfig, redeemAmount: number) {
    await getAccountDetail(oceanLendingConfig, "redeem", "before")
    await oceanLendingConfig.collateralToken.redeem(redeemAmount.toString(), oceanLendingConfig.confirmations);
    await getAccountDetail(oceanLendingConfig, "redeem", "after")
}

export async function redeemAll(oceanLendingConfig: OceanLendingConfig) {
    const accountDetailBefore = await getAccountDetail(oceanLendingConfig, "redeemAll", "before")
    await oceanLendingConfig.collateralToken.redeem(accountDetailBefore.collateralToken.toString(), oceanLendingConfig.confirmations);
    await getAccountDetail(oceanLendingConfig, "redeemAll", "after")
}

async function getAccountDetail(oceanLendingConfig: OceanLendingConfig, operation: string, status: string): Promise<AccountDetail> {
    const [
        liquidityInfo,
        underlyingOfBorrowedToken,
        underlyingOfCollateralToken,
        borrowedToken,
        collateralToken,
        borrowBalance
    ] = await Promise.all([
        oceanLendingConfig.comptroller.getAccountLiquidity(oceanLendingConfig.account.address),
        oceanLendingConfig.underlyingOfBorrowedToken.balanceOf(oceanLendingConfig.account.address),
        oceanLendingConfig.underlyingOfCollateralToken.balanceOf(oceanLendingConfig.account.address),
        oceanLendingConfig.borrowedToken.balanceOf(oceanLendingConfig.account.address),
        oceanLendingConfig.collateralToken.balanceOf(oceanLendingConfig.account.address),
        oceanLendingConfig.borrowedToken.accountBorrowBalance(oceanLendingConfig.account.address)
    ])
    const liquidity = liquidityInfo[1] == 0 ? liquidityInfo[0] : -liquidityInfo[1]
    logger.info(` ${status.toUpperCase()} ${operation.toUpperCase()}: liquidity: ${liquidity}, underlying of collateral token: ${underlyingOfCollateralToken}, collateral token : ${underlyingOfCollateralToken},  underlying of borrowed token: ${underlyingOfBorrowedToken}, borrowed token : ${borrowedToken} borrow balance : ${borrowBalance}`);
    return {
        liquidity,
        underlyingOfBorrowedToken,
        underlyingOfCollateralToken,
        borrowedToken,
        collateralToken,
        borrowBalance
    }
}

export const getNegativeOne = () => {
    return Web3.utils.toHex(Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).sub(Web3.utils.toBN(1)));
};

/**
 * parse OceanLending Configuration json file.
 */
export async function parseOceanLendingConfiguration(options: OptionValues): Promise<OceanLendingConfig> {
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

    // load the oToken object
    const oTokenAbi = readJsonSync(options.oToken);
    const borrowedToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.borrowedToken.address,
        account,
        config.oTokens.borrowedToken.parameters
    );

    const collateralToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.collateralToken.address,
        account,
        config.oTokens.collateralToken.parameters
    );


    // load the erc20 token object
    const erc20Abi = readJsonSync(options.erc20);
    const underlyingOfCollateralToken = new ERC20Token(
        web3,
        erc20Abi,
        config.oTokens.collateralToken.parameters.underlying,
        account
    );

    const underlyingOfBorrowedToken = new ERC20Token(
        web3,
        erc20Abi,
        config.oTokens.borrowedToken.parameters.underlying,
        account
    );

    const comptrollerAbi = readJsonSync(options.comptroller);
    const comptroller = new Comptroller(
        web3,
        comptrollerAbi,
        config.comptroller.address,
        account
    );

    const confirmations: TxnOptions = { confirmations: Number(options.confirmations) }

    logger.info(`Using account: ${account.address}, borrowedToken: ${borrowedToken.address}, 
    collateralToken: ${collateralToken.address}, underlyingOfBorrowedToken: ${underlyingOfBorrowedToken.address},
    underlyingOfCollateralToken: ${underlyingOfCollateralToken.address}, comptroller: ${comptroller.address}`);
    return {
        account,
        borrowedToken,
        collateralToken,
        underlyingOfBorrowedToken,
        underlyingOfCollateralToken,
        comptroller,
        confirmations
    };
}

export function makeOceanLendingCommand(): Command {
    // Add ocean subcommand
    const ocean = new Command('ocean');
    ocean.description('execute ocean-lending command')
        .requiredOption('-c, --config-path <path>', 'ocean-lending configuration json path')
        .option('-n, --confirmations <number>', 'number of confirmations of the transaction', '1')
        .option('-o, --oToken <path>', 'ocean-lending oToken abi path', '../ocean-lending/config/oToken.json')
        .option('-e, --erc20 <path>', 'ocean-lending erc20 abi path', '../ocean-lending/config/erc20.json')
        .option('-m, --comptroller <path>', 'ocean-lending comptroller abi path', '../ocean-lending/config/comptroller.json')
        .option('-p, --priceOracle <path>', 'ocean-lending priceOracle abi path', '../ocean-lending/config/priceOracle.json');

    // Add enterMarkets subcommand
    ocean
        .command('enterMarkets')
        .description('enter Markets and check the balance')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: enterMarkets started, configPath: %o', ocean.opts().configPath);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await enterMarkets(oceanLendingConfig);
            logger.info('OceanLending: enterMarkets success!');
        });

    // Add deposit subcommand
    ocean
        .command('deposit')
        .description('charge otoken deposit with ERC20Token')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to deposit')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: deposit started, configPath: %o, amount: %o ', ocean.opts().configPath, options.amount);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await deposit(oceanLendingConfig, options.amount)
            logger.info('OceanLending: deposit success!');
        });

    // Add redeem subcommand
    ocean
        .command('redeem')
        .description('redeem minted oToken')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to redeem')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: redeem started, configPath: %o, amount: %o', ocean.opts().configPath, options.amount);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await redeem(oceanLendingConfig, options.amount)
            logger.info('OceanLending: redeem success!');
        });

    // Add redeemAll subcommand
    ocean
        .command('redeemAll')
        .description('redeem all minted oToken')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: redeemAll started, configPath: %o', ocean.opts().configPath);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await redeemAll(oceanLendingConfig)
            logger.info('OceanLending: redeemAll success!');
        });

    // Add borrow subcommand
    ocean
        .command('borrow')
        .description('borrow otoken use KONO as collateral')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to borrow')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: borrow started, configPath: %o, amount: %o', ocean.opts().configPath, options.amount);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await borrow(oceanLendingConfig, options.amount);
            logger.info('OceanLending: borrow success!');
        });

    // Add repay subcommand
    ocean
        .command('repay')
        .description('repay borrow balance')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to repay')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: repay started, configPath: %o, amount: %o', ocean.opts().configPath, options.amount);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await repay(oceanLendingConfig, options.amount);
            logger.info('OceanLending: repay success!');
        });

    // Add repay subcommand
    ocean
        .command('repayAll')
        .description('repay all borrow balance')
        .action(async (options: OptionValues) => {
            logger.info('OceanLending: repayAll started, configPath: %o', ocean.opts().configPath);
            const oceanLendingConfig = await parseOceanLendingConfiguration(ocean.opts());
            await repayAll(oceanLendingConfig);
            logger.info('OceanLending: repayAll success!');
        });
    return ocean;
}
