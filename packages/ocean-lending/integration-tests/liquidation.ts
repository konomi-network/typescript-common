import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../src/clients/erc20Token';
import { OToken } from '../src/clients/oToken';
import { Comptroller } from '../src/clients/comptroller';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from "../src/reading"
import { PriceOracleAdaptor } from '../src/clients/priceOracle';
import { ensure } from '../src/utils';
import { isEqual } from 'lodash'
import { FeedFactory } from '../src/clients/feedFactory';
import { TxnOptions } from 'options';

async function liquidate(borrower: Account, liquidator: Account, ETHOfBorrower: OToken, TSTOfBorrower: OToken, ETHOfLiquidator: OToken, TSTOfLiquidator: OToken, comptroller: Comptroller, liquidatorComptroller: Comptroller, feedFactory: FeedFactory, priceOracle: PriceOracleAdaptor) {
    console.log('==== liquidate start ====');
    const option = { confirmations: 1 }
    const subscriptionId = '3'
    const priceMantissa = 1E8;
    const oTokenMantissa = 1E18;
    const priceMultiplier = 1.01
    const expectTSTUnderlyingPriceBeforeRise = 1000 * priceMantissa; // 1000USD per TST

    // submit TST price
    await feedFactory.submit(subscriptionId, expectTSTUnderlyingPriceBeforeRise.toString(), option);
    const TSTUnderlyingPriceBeforeRise = Number(await priceOracle.getUnderlyingPrice(TSTOfBorrower.address));
    console.log(`TSTUnderlyingPriceBeforeRise submitted is: ${expectTSTUnderlyingPriceBeforeRise / priceMantissa}, TSTUnderlyingPriceBeforeRise: ${TSTUnderlyingPriceBeforeRise}`);

    // // borrower supply x amount ETHs as collateral
    await comptroller.enterMarkets([ETHOfBorrower.address, TSTOfBorrower.address], option);

    // Before operation, repay all debt.
    const negativeOne = getNegativeOne()
    await TSTOfBorrower.repayBorrow(negativeOne, option);
    await ETHOfBorrower.repayBorrow(negativeOne, option);
    await TSTOfLiquidator.repayBorrow(negativeOne, option);
    await ETHOfLiquidator.repayBorrow(negativeOne, option);

    // Before operation, borrower redeem all minted ETH 
    const mintedAmount = await ETHOfBorrower.balanceOf(borrower.address);
    await ETHOfBorrower.redeem(mintedAmount.toString(), option);

    // borrower supply 10 ETHs as collateral
    const supplyAmount = 10 * oTokenMantissa;
    await ETHOfBorrower.mint(supplyAmount.toString(), option);

    // Before borrower borrow
    const borrowerETHBorrowBalanceBeforeBorrow = await ETHOfBorrower.borrowBalanceCurrent(borrower.address);
    const borrowerETHBalanceBeforeBorrow = await ETHOfBorrower.balanceOf(borrower.address);

    const borrowerTSTBorrowBalanceBeforeBorrow = await TSTOfBorrower.borrowBalanceCurrent(borrower.address);
    const borrowerTSTBalanceBeforeBorrow = await TSTOfBorrower.balanceOf(borrower.address);

    const borrowerLiquidityBeforeBorrow = await comptroller.getAccountLiquidity(borrower.address);
    console.log(`**Before borrower borrow**: borrowerETHBalance  ${borrowerETHBalanceBeforeBorrow}, borrowerETHBorrowBalance: ${borrowerETHBorrowBalanceBeforeBorrow}, borrowerTSTBalance : ${borrowerTSTBalanceBeforeBorrow}, borrowerTSTBorrowBalance: ${borrowerTSTBorrowBalanceBeforeBorrow} borrowerLiquidity: ${borrowerLiquidityBeforeBorrow}`);

    // borrower borrow max amount of TSTs
    const borrowAmount = Math.floor(borrowerLiquidityBeforeBorrow / TSTUnderlyingPriceBeforeRise * oTokenMantissa).toString();
    await TSTOfBorrower.borrow(borrowAmount, option);

    // After borrower borrowed max amount of TSTs
    const borrowerETHBorrowBalanceAfterBorrow = await ETHOfBorrower.borrowBalanceCurrent(borrower.address);
    const borrowerETHBalanceAfterBorrow = await ETHOfBorrower.balanceOf(borrower.address);

    const borrowerTSTBorrowBalanceAfterBorrow = await TSTOfBorrower.borrowBalanceCurrent(borrower.address);
    const borrowerTSTBalanceAfterBorrow = await TSTOfBorrower.balanceOf(borrower.address);

    const borrowerLiquidityAfterBorrow = await comptroller.getAccountLiquidity(borrower.address);
    console.log(`**after borrower borrow**: borrowerETHBalance  ${borrowerETHBalanceAfterBorrow}, borrowerETHBorrowBalance: ${borrowerETHBorrowBalanceAfterBorrow}, borrowerTSTBalance : ${borrowerTSTBalanceAfterBorrow}, borrowerTSTBorrowBalance: ${borrowerTSTBorrowBalanceAfterBorrow} borrowerLiquidity: ${borrowerLiquidityAfterBorrow}`)

    // Multiply TST underlying price by priceMultiplier
    const expectTSTUnderlyingPriceAfterRise = expectTSTUnderlyingPriceBeforeRise * priceMultiplier; // 1010 USD per 1 TST
    await feedFactory.submit(subscriptionId, expectTSTUnderlyingPriceAfterRise.toString(), option);
    const actualTSTUnderlyingPriceAfterRise = await priceOracle.getUnderlyingPrice(TSTOfBorrower.address);
    console.log(`TSTUnderlyingPriceBeforeRise: ${TSTUnderlyingPriceBeforeRise}, actualTSTUnderlyingPriceAfterRise: ${actualTSTUnderlyingPriceAfterRise}`)

    // check whether borrower liquidity is 0;
    const borrowerLiquidityAfterPriceRise = await comptroller.getAccountLiquidityInfo(borrower.address);
    ensure(borrowerLiquidityAfterPriceRise.liquidity == 0 && borrowerLiquidityAfterPriceRise.shortfall > 0, 'the account is not underwater!!!')
    console.log(`**borrower after price rise**: borrowerLiquidity: ${borrowerLiquidityAfterPriceRise.liquidity}, shortfall: ${borrowerLiquidityAfterPriceRise.shortfall}`);

    // liquidator supplies the double amount of collateral for liquidation
    await liquidatorComptroller.enterMarkets([ETHOfBorrower.address, TSTOfBorrower.address], option);
    await ETHOfLiquidator.mint((supplyAmount * 2).toString(), option);

    // Before liquidator liquidation
    const liquidatorETHBalanceBeforeLiquidate = await ETHOfBorrower.balanceOf(liquidator.address);
    const liquidatorTSTBalanceBeforeLiquidate = await TSTOfBorrower.balanceOf(liquidator.address);
    const liquidatorLiquidityBeforeLiquidate = await comptroller.getAccountLiquidity(liquidator.address);
    console.log(`**before liquidator liquidation**: liquidatorETHBalance  ${liquidatorETHBalanceBeforeLiquidate}, liquidatorTSTBalance: ${liquidatorTSTBalanceBeforeLiquidate}, liquidatorLiquidity : ${liquidatorLiquidityBeforeLiquidate}`)

    // liquidator liquidates borrower
    const closeFactor = await comptroller.closeFactor();
    // liquidator repays max repayAmount for borrower
    const liquidateAmount = Math.floor(Number(borrowerTSTBorrowBalanceAfterBorrow) * closeFactor / 101);
    const repayBorrowAllowed = await comptroller.repayBorrowAllowed(TSTOfBorrower.address, liquidator.address, borrower.address, liquidateAmount.toString());
    const liquidateBorrowAllowed = await comptroller.liquidateBorrowAllowed(TSTOfBorrower.address, ETHOfBorrower.address, liquidator.address, borrower.address, liquidateAmount.toString());
    console.log(`closeFactor: ${closeFactor}, liquidateAmount: ${liquidateAmount / oTokenMantissa}, repayBorrowAllowed: ${repayBorrowAllowed}, liquidateBorrowAllowed: ${liquidateBorrowAllowed}`);
    ensure(repayBorrowAllowed == true && liquidateBorrowAllowed == true, 'pool comptroller will reject the liquidation, please check the params.')

    await TSTOfLiquidator.liquidateBorrow(borrower.address, liquidateAmount.toString(), ETHOfBorrower.address,
        option,
        (hash) => console.log("hash obtained:", hash),
        (receipt) => console.log(receipt.events?.Failure),
        (error, receipt) => console.log("error", error));

    // After liquidator liquidation
    const borrowerETHBalanceAfterLiquidate = await ETHOfBorrower.balanceOf(borrower.address);
    const borrowerTSTBorrowBalanceAfterLiquidate = await TSTOfBorrower.borrowBalanceCurrent(borrower.address);
    const borrowerTSTBalanceAfterLiquidate = await TSTOfBorrower.balanceOf(borrower.address);
    const borrowerLiquidityAfterLiquidate = await comptroller.getAccountLiquidityInfo(borrower.address);
    console.log(`**borrower after liquidation:** borrowerETHBalance ${borrowerETHBalanceAfterLiquidate}, borrowerTSTBalance : ${borrowerTSTBalanceAfterLiquidate}, borrowerTSTBorrowBalance: ${borrowerTSTBorrowBalanceAfterLiquidate}, borrowerLiquidity: ${borrowerLiquidityAfterLiquidate.liquidity}, borrowerShortfall: ${borrowerLiquidityAfterLiquidate.shortfall}`);

    const liquidatorETHBalanceAfterLiquidate = await ETHOfBorrower.balanceOf(liquidator.address);
    const liquidatorTSTBalanceAfterLiquidate = await TSTOfBorrower.balanceOf(liquidator.address);
    const liquidatorLiquidityAfterLiquidate = await comptroller.getAccountLiquidity(liquidator.address);
    console.log(`**after liquidator liquidation**: liquidatorETHBalance  ${liquidatorETHBalanceAfterLiquidate}, liquidatorTSTBalance: ${liquidatorTSTBalanceAfterLiquidate}, liquidatorLiquidity : ${liquidatorLiquidityAfterLiquidate}`);

    ensure(borrowerLiquidityAfterLiquidate.shortfall == 0 && borrowerLiquidityAfterLiquidate.liquidity > 0, "After liquidation, the shortfall of borrower should be zero, and liquidity of borrower should be positive!!")
    ensure(borrowerTSTBorrowBalanceAfterBorrow > borrowerTSTBorrowBalanceAfterLiquidate, 'make sure the borrow of borrower has dropped after liquidation.');
    ensure(borrowerETHBalanceAfterBorrow > borrowerETHBalanceAfterLiquidate, 'make sure ETH collateral of borrower has dropped after liquidation.')
    ensure(liquidatorETHBalanceAfterLiquidate > liquidatorETHBalanceBeforeLiquidate, 'make sure liquidator has more ETH collateral after liquidation.')

    console.log('==== liquidate end ====');
}


describe('Liquidate', () => {
    const config = readJsonSync('./config/config.json');
    const oTokenAbi = readJsonSync('./config/oToken.json');
    const erc20Abi = readJsonSync('./config/erc20.json');
    const comptrollerAbi = readJsonSync('./config/comptroller.json');
    const priceOracleAbi = readJsonSync('./config/priceOracle.json');
    const feedFactoryAbi = readJsonSync('./config/feedFactory.json');

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let borrower: Account;
    let liquidator: Account;
    let TSTOfBorrower: OToken;
    let ETHOfBorrower: OToken;
    let ETHOfLiquidator: OToken;
    let TSTOfLiquidator: OToken;
    let TSTUnderlying: ERC20Token;
    let ETHUnderlying: ERC20Token;
    let erc20Token: ERC20Token;
    let comptroller: Comptroller;
    let liquidatorComptroller: Comptroller;
    let priceOracle: PriceOracleAdaptor;
    let feedFactory: FeedFactory;
    const option: TxnOptions = { confirmations: 1 }
    const allowance = '1000000000000000000'

    beforeAll(async () => {
        if (config.borrower.encryptedAccountJson) {
            const pw = await readPassword();
            borrower = loadWalletFromEncyrptedJson(config.borrower.encryptedAccountJson, pw, web3);
        } else if (config.borrower.privateKey) {
            borrower = loadWalletFromPrivate(config.borrower.privateKey, web3);
        } else {
            throw Error('Cannot setup borrower account');
        }

        if (config.liquidator.encryptedAccountJson) {
            const pw = await readPassword();
            liquidator = loadWalletFromEncyrptedJson(config.liquidator.encryptedAccountJson, pw, web3);
        } else if (config.liquidator.privateKey) {
            liquidator = loadWalletFromPrivate(config.liquidator.privateKey, web3);
        } else {
            throw Error('Cannot setup liquidator account');
        }

        console.log(`Using borrower account: ${borrower.address}, Using liquidator account: ${liquidator.address}`);

        // load the oToken object
        ETHOfBorrower = new OToken(web3, oTokenAbi, config.oTokens.ETH.address, borrower, config.oTokens.ETH.parameters);
        TSTOfBorrower = new OToken(web3, oTokenAbi, config.oTokens.TST.address, borrower, config.oTokens.TST.parameters);
        ETHOfLiquidator = new OToken(web3, oTokenAbi, config.oTokens.ETH.address, liquidator, config.oTokens.ETH.parameters);
        TSTOfLiquidator = new OToken(web3, oTokenAbi, config.oTokens.TST.address, liquidator, config.oTokens.TST.parameters);


        // load the erc20 token object
        ETHUnderlying = new ERC20Token(web3, erc20Abi, config.oTokens.ETH.parameters.underlying, borrower);
        TSTUnderlying = new ERC20Token(web3, erc20Abi, config.oTokens.TST.parameters.underlying, borrower);

        // increase allowance
        // await ETHUnderlying.increaseAllowance(config.konomiOceanLending.address, allowance, option)
        // await TSTUnderlying.increaseAllowance(config.konomiOceanLending.address, allowance, option)

        comptroller = new Comptroller(web3, comptrollerAbi, config.comptroller.address, borrower);
        liquidatorComptroller = new Comptroller(web3, comptrollerAbi, config.comptroller.address, liquidator);

        // load price feed object
        priceOracle = new PriceOracleAdaptor(web3, priceOracleAbi, config.priceOracle.address, borrower);

        // load feed factory object
        feedFactory = new FeedFactory(web3, feedFactoryAbi, config.feedFactory.address, borrower);
    });

    it('liquidator liquidate borrower', async () => {
        // actual tests
        await liquidate(borrower, liquidator, ETHOfBorrower, TSTOfBorrower, ETHOfLiquidator, TSTOfLiquidator, comptroller, liquidatorComptroller, feedFactory, priceOracle)
    }, 95000000);
});

export const getNegativeOne = () => {
    return Web3.utils.toHex(Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).sub(Web3.utils.toBN(1)));
};