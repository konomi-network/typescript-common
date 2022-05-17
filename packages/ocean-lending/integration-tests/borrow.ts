import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../src/clients/erc20Token';
import { OToken } from '../src/clients/oToken';
import { Comptroller } from '../src/clients/comptroller';
import { ensure, ONE_ETHER, sleep } from '../src/utils';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from "../src/reading"
import { PriceOracleAdaptor } from '../src/clients/priceOracle';

async function enterMarkets(account: Account, markets: string[], comptroller: Comptroller) {
  console.log('==== enterMarkets ====');
  await comptroller.enterMarkets(markets, { confirmations: 3 });

  const liquidity: number[] = await comptroller.getAccountLiquidity(account.address);
  console.log(`You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);

  const konoCollateralFactor: number = await comptroller.collateralFactor(markets[0]);
  console.log(
    `You can borrow up to ${konoCollateralFactor}% of your TOTAL collateral supplied to the protocol as oKONO.`
  );
}

async function borrow(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  priceOracle: PriceOracleAdaptor,
  comptroller: Comptroller,
  underlyingToBorrow: number
) {
  console.log('==== borrow ====');
  const depositAmount = BigInt(1000) * ONE_ETHER;
  await oToken.mint(depositAmount.toString(), { confirmations: 3 });
  const liquidity: number[] = await comptroller.getAccountLiquidity(account.address);
  ensure(liquidity.valueOf() > 0, "You don't have any liquid assets pooled in the protocol.");
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const borrowBalanceBefore = await oToken.accountBorrowBalance(account.address);
  const konoCollateralFactor: number = await comptroller.collateralFactor(oToken.address);
  const exchangeRate = await oToken.exchangeRate();
  const underlyingPrice = await priceOracle.getUnderlyingPrice(oToken.address);

  ensure(oTokenBefore.valueOf() > BigInt(0), "You don't have any KONO as collateral");
  console.log('erc20Before:', erc20Before, 'oTokenBefore:', oTokenBefore);
  console.log(`exchangeRate: ${Number(exchangeRate) / 1e28}`);
  console.log(`underlyingPrice: ${(+underlyingPrice).toFixed(6)} USD`);
  console.log('NEVER borrow near the maximum amount because your account will be instantly liquidated.');

  const underlyingDeposited = (Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals)) * Number(exchangeRate);
  const underlyingBorrowable = (underlyingDeposited * konoCollateralFactor) / 100;
  // const underlyingToBorrow = 500;
  const underlyingDecimals = 18;
  const toBorrowLiquid = (underlyingToBorrow * +underlyingPrice * konoCollateralFactor) / 100;
  console.log(`Borrow balance currently is ${Number(borrowBalanceBefore) / Math.pow(10, underlyingDecimals)}`);

  ensure(Number(borrowBalanceBefore) <= underlyingBorrowable, 'Borrow balance exceeded collateral factor');
  ensure(toBorrowLiquid < liquidity, 'Borrowing amount exceed account liquid');

  const scaledUpBorrowAmount = Web3.utils.toWei(Web3.utils.toBN(underlyingToBorrow));
  await oToken.borrow(scaledUpBorrowAmount.toString(), { confirmations: 3 });

  const borrowBalanceAfter = await oToken.accountBorrowBalance(account.address);
  console.log(`Borrow balance after is ${Number(borrowBalanceAfter) / Math.pow(10, underlyingDecimals)}`);

  await oToken.approve(scaledUpBorrowAmount.toString(), { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  console.log('erc20After:', erc20After, ' oTokenAfter:', oTokenAfter);

  ensure(erc20After > erc20Before, `invalid erc20 balance, expected ${erc20Before}, actual: ${erc20After}`);

  ensure(oTokenAfter === oTokenBefore, 'invalid borrow balance');
  // oToken.convertFromUnderlying(amount);
}

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
