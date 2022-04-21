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

async function liquidationIncentive(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
  console.log('==== liquidationIncentive ====');
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const incentive = await comptroller.liquidationIncentive();
  console.log('erc20:', erc20Before, ' oToken', oTokenBefore, 'incentive:', incentive);
  console.log('==== liquidationIncentive ====');
}

async function collateralFactor(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
  console.log('==== collateralFactor ====');
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const factor = await comptroller.collateralFactor(account.address);
  console.log(`erc20: ${erc20Before}, oToken: ${oTokenBefore}, collateralFactor: ${factor}%`);
  console.log('==== collateralFactor ====');
}

/**
 * The percent, ranging from 0% to 100%, of a liquidatable account's borrow that can be repaid in a single liquidate transaction.
 */
async function closeFactor(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
  console.log('==== closeFactor ====');
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const factor = await comptroller.closeFactor();
  console.log(`erc20: ${erc20Before}, oToken: ${oTokenBefore}, closeFactor: ${factor}%`);
  console.log('==== closeFactor ====');
}

async function getHypotheticalAccountLiquidity(account: Account, TETH: OToken, TBTC: OToken, comptroller: Comptroller) {
  console.log('==== getHypotheticalAccountLiquidity start ====');
  const option = { confirmations: 1 }
  const redeemTokens = 0;
  const borrowAmount = 100;

  await comptroller.enterMarkets([TETH.address, TBTC.address], option);
  await TETH.mint('100', option);
  // await TETH.borrow("10", option);
  await TBTC.borrow(borrowAmount.toString(), option);

  const TETHLiquidity = await comptroller.getAccountLiquidity(account.address);
  const TETHBorrowBalanceCurrent = await TETH.accountBorrowBalance(account.address);
  const TETHBalance = await TETH.balanceOf(account.address);
  console.log(`TETHBalance: ${TETHBalance}, TETHBorrowBalanceCurrent: ${TETHBorrowBalanceCurrent}, TETHLiquidity: ${TETHLiquidity} `)

  const TBTCLiquidity = await comptroller.getAccountLiquidity(account.address);
  const TBTCBorrowBalanceCurrent = await TBTC.accountBorrowBalance(account.address);
  const TBTCBalance = await TBTC.balanceOf(account.address);
  console.log(`TBTCBalance: ${TBTCBalance}, TBTCBorrowBalanceCurrent: ${TBTCBorrowBalanceCurrent}, TBTCLiquidity: ${TBTCLiquidity} `)

  const hypotheticalAccountLiquidity = await comptroller.getHypotheticalAccountLiquidity(account.address, TBTC.address, redeemTokens, borrowAmount)
  console.log("hypotheticalAccountLiquidity: ", hypotheticalAccountLiquidity);

  ensure(
    hypotheticalAccountLiquidity.success == true &&
    !(hypotheticalAccountLiquidity.liquidity == 0 && hypotheticalAccountLiquidity.shortfall == 0),
    `At most one of liquidity or shortfall shall be non-zero, actual liquidity: ${hypotheticalAccountLiquidity.liquidity}, actual shortfall: ${hypotheticalAccountLiquidity.shortfall}`
  )
  console.log('==== getHypotheticalAccountLiquidity end ====');
}

async function checkMembership(account: Account, TETH: OToken, TBTC: OToken, comptroller: Comptroller) {
  console.log('==== checkMembership start ====');
  const option = { confirmations: 1 }

  await comptroller.enterMarkets([TETH.address, TBTC.address], option);
  const assetsInBefore = await comptroller.getAssetsIn(account.address);
  const TBTCLiquidityBeforeExitMarket = await comptroller.getAccountLiquidity(account.address);
  const TBTCBorrowBalanceBeforeExitMarket = await TBTC.accountBorrowBalance(account.address);
  const TBTCBalanceBeforeExitMarket = await TBTC.balanceOf(account.address);
  console.log(`assetsInBefore: ${assetsInBefore}, TBTCBalanceBeforeExitMarket: ${TBTCBalanceBeforeExitMarket}, TBTCBorrowBalanceCurrentBeforeExitMarket: ${TBTCBorrowBalanceBeforeExitMarket}, TBTCLiquidity: ${TBTCLiquidityBeforeExitMarket} `)

  const negativeOne = getNegativeOne();
  // Before exit market, account must not have an outstanding borrow balance in the asset
  await TBTC.repayBorrow(negativeOne, option);
  const TBTCBorrowBalanceAfterRepayAll = await TBTC.accountBorrowBalance(account.address);
  ensure(TBTCBorrowBalanceAfterRepayAll == 0, `Before exit market, account must not have an outstanding borrow balance in the asset, but actual borrow balance is: ${TBTCBorrowBalanceAfterRepayAll}`)
  await comptroller.exitMarket(TBTC.address, option);

  const assetsInAfter = await comptroller.getAssetsIn(account.address);
  const TETHMembership = await comptroller.checkMembership(account.address, TETH.address);
  const TBTCMembership = await comptroller.checkMembership(account.address, TBTC.address);
  console.log(`assetsInAfter: ${assetsInAfter}, TETHMembership: ${TETHMembership}, TBTCMembership: ${TBTCMembership}`);
  ensure(isEqual(assetsInAfter, [TETH.address]), `TBTC was already exited, expected assetsIn: ${[TETH.address]}, actual assetsIn: ${assetsInAfter}`);
  ensure(TETHMembership == true, `TETH was already entered, expected membership: true, actual membership: ${TETHMembership}`);
  ensure(TBTCMembership == false, `TBTC was already exited, expected membership: false, actual membership: ${TBTCMembership}`);

  console.log('==== checkMembership end ====');
}

async function exitMarket(account: Account, TETH: OToken, TBTC: OToken, comptroller: Comptroller) {
  console.log('==== exitMarket start ====');
  const option = { confirmations: 1 }

  await comptroller.enterMarkets([TETH.address, TBTC.address], option);
  const assetsInBefore = await comptroller.getAssetsIn(account.address);
  const TBTCLiquidityBeforeExitMarket = await comptroller.getAccountLiquidity(account.address);
  const TBTCBorrowBalanceBeforeExitMarket = await TBTC.accountBorrowBalance(account.address);
  const TBTCBalanceBeforeExitMarket = await TBTC.balanceOf(account.address);
  console.log(`assetsInBefore: ${assetsInBefore}, TBTCBalanceBeforeExitMarket: ${TBTCBalanceBeforeExitMarket}, TBTCBorrowBalanceCurrentBeforeExitMarket: ${TBTCBorrowBalanceBeforeExitMarket}, TBTCLiquidity: ${TBTCLiquidityBeforeExitMarket} `)

  const negativeOne = getNegativeOne();
  // Before exit market, account must not have an outstanding borrow balance in the asset
  await TBTC.repayBorrow(negativeOne, option);
  const TBTCBorrowBalanceAfterRepayAll = await TBTC.accountBorrowBalance(account.address);
  ensure(TBTCBorrowBalanceAfterRepayAll == 0, `Before exit market, account must not have an outstanding borrow balance in the asset, but actual borrow balance is: ${TBTCBorrowBalanceAfterRepayAll}`)
  await comptroller.exitMarket(TBTC.address, option);

  const assetsInAfter = await comptroller.getAssetsIn(account.address);
  console.log(`assetsIn: ${assetsInAfter}`);
  ensure(isEqual(assetsInAfter, [TETH.address]), `TBTC was already exited, expected assetsIn: ${[TETH.address]}, actual assetsIn: ${assetsInAfter}`);
  console.log('==== exitMarket end ====');
}

describe('Comptroller', () => {
  const config = readJsonSync('./config/config.json');
  const oTokenAbi = readJsonSync('./config/oToken.json');
  const erc20Abi = readJsonSync('./config/erc20.json');
  const comptrollerAbi = readJsonSync('./config/comptroller.json');
  const priceOracleAbi = readJsonSync('./config/priceOracle.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oToken: OToken;
  let TBTC: OToken;
  let TETH: OToken;
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

    TETH = new OToken(web3, oTokenAbi, config.oTokens.TETH.address, account, config.oTokens.TETH.parameters);

    TBTC = new OToken(web3, oTokenAbi, config.oTokens.TBTC.address, account, config.oTokens.TBTC.parameters);

    // // load the erc20 token object
    // erc20Token = new ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);

    comptroller = new Comptroller(web3, comptrollerAbi, config.comptroller.address, account);

    // load price feed object
    priceOracle = new PriceOracleAdaptor(web3, priceOracleAbi, config.priceOracle.address, account);
  });

  it('key flow test', async () => {
    // // actual tests
    // await liquidationIncentive(account, oToken, erc20Token, comptroller);
    // await collateralFactor(account, oToken, erc20Token, comptroller);
    // await closeFactor(account, oToken, erc20Token, comptroller);

    // const oracleAddress = await comptroller.oracleAddress();
    // console.log('==== oracleAddress', oracleAddress);
    // expect(oracleAddress).to.be.a('string');

    // const totalLiquidity = await comptroller.totalLiquidity(priceOracle);
    // console.log('==== totalLiquidity:', totalLiquidity);
    // expect(totalLiquidity).to.be.gt(0);

    // const blockTime = 3;
    // const minBorrowRateAPY = await comptroller.minBorrowAPY(blockTime);
    // console.log('==== minBorrowRateAPY:', minBorrowRateAPY);
    // expect(minBorrowRateAPY >= BigInt(0)).to.be.eq(true);

    // const maxSupplyRateAPY = await comptroller.maxSupplyAPY(blockTime);
    // console.log('==== maxSupplyRateAPY:', maxSupplyRateAPY);
    // expect(maxSupplyRateAPY >= BigInt(0)).to.be.eq(true);

    const blockTime = 3;
    const summary = await comptroller.getOceanMarketSummary(blockTime, priceOracle);
    console.log(summary);

    await getHypotheticalAccountLiquidity(account, TETH, TBTC, comptroller);
    await checkMembership(account, TETH, TBTC, comptroller);
    await exitMarket(account, TETH, TBTC, comptroller);
  });
});

export const getNegativeOne = () => {
  return Web3.utils.toHex(Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).sub(Web3.utils.toBN(1)));
};