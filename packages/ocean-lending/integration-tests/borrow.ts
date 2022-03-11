import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "clients/erc20Token";
import { OToken } from "clients/oToken";
import { Comptroller } from "clients/comptroller";
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { PriceOracle } from "clients/priceOracle";
import { exit } from "process";

async function enterMarkets(
  account: Account,
  markets: string[],
  comptroller: Comptroller
) {
  console.log("==== enterMarkets ====");
  await comptroller.enterMarkets(markets, { confirmations: 3 });

  const liquidity: number = await comptroller.getAccountLiquidity(
    account.address
  );
  console.log(
    `You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`
  );

  const konoCollateralFactor: number = await comptroller.markets(markets[0]);
  console.log(
    `You can borrow up to ${konoCollateralFactor}% of your TOTAL collateral supplied to the protocol as oKONO.`
  );
}

async function borrow(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  priceOracle: PriceOracle,
  comptroller: Comptroller,
  underlyingToBorrow: number
) {
  console.log("==== borrow ====");
  const liquidity: number = await comptroller.getAccountLiquidity(
    account.address
  );
  ensure(
    liquidity.valueOf() > 0,
    `You don't have any liquid assets pooled in the protocol.`
  );
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const borrowBalanceBefore = await oToken.borrowBalanceCurrent(
    account.address
  );
  const konoCollateralFactor: number = await comptroller.markets(
    oToken.address
  );
  const exchangeRate = await oToken.exchangeRate();
  const underlyingPrice = await priceOracle.getUnderlyingPrice(oToken.address);

  ensure(
    oTokenBefore.valueOf() > BigInt(0),
    "You don't have any KONO as collateral"
  );
  console.log("erc20Before:", erc20Before, "oTokenBefore:", oTokenBefore);
  console.log(`exchangeRate: ${exchangeRate / 1e28}`);
  console.log(`underlyingPrice: ${underlyingPrice.toFixed(6)} USD`);
  console.log(
    `NEVER borrow near the maximum amount because your account will be instantly liquidated.`
  );

  const underlyingDeposited =
    (Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals)) *
    exchangeRate;
  const underlyingBorrowable =
    (underlyingDeposited * konoCollateralFactor) / 100;
  // const underlyingToBorrow = 500;
  const underlyingDecimals = 18;
  const toBorrowLiquid =
    (underlyingToBorrow * underlyingPrice * konoCollateralFactor) / 100;
  console.log(
    `Borrow balance currently is ${
      borrowBalanceBefore / Math.pow(10, underlyingDecimals)
    }`
  );

  ensure(
    borrowBalanceBefore <= underlyingBorrowable,
    `Borrow balance exceeded collateral factor`
  );
  ensure(toBorrowLiquid < liquidity, `Borrowing amount exceed account liquid`);

  const scaledUpBorrowAmount =
    underlyingToBorrow * Math.pow(10, underlyingDecimals);
  await oToken.borrow(scaledUpBorrowAmount, { confirmations: 3 });

  const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
  console.log(
    `Borrow balance after is ${
      borrowBalanceAfter / Math.pow(10, underlyingDecimals)
    }`
  );

  await oToken.approve(scaledUpBorrowAmount, { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

  ensure(
    erc20After > erc20Before,
    `invalid erc20 balance, expected ${erc20Before}, actual: ${erc20After}`
  );

  ensure(oTokenAfter === oTokenBefore, "invalid borrow balance");
  // oToken.convertFromUnderlying(amount);
}

async function repayBorrow(
  account: Account,
  oToken: OToken,
  token: ERC20Token
) {
  console.log("==== repayBorrow ====");
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  console.log("erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);

  const balance = await oToken.borrowBalanceCurrent(account.address);
  console.log(`borrow balance to repay ${balance / 1e18}`);
  ensure(
    balance > 0,
    "invalid borrow balance to repay, expected more than zero"
  );

  await oToken.repayBorrow(BigInt(balance), { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

  ensure(
    erc20Before > erc20After,
    `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`
  );
}

async function main() {
  // const config = readJsonSync('./config/config.json');
  const config = readJsonSync("../konomi-CLI/testConfig/config.json");

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(
      config.encryptedAccountJson,
      pw,
      web3
    );
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error("Cannot setup account");
  }

  console.log("Using account:", account.address);

  // load the oToken object
  const oTokenAbi = readJsonSync("./config/oToken.json");
  const oToken = new OToken(
    web3,
    oTokenAbi,
    config.oTokens.oKono.address,
    account,
    config.oTokens.oKono.parameters
  );

  // load the erc20 token object
  const erc20Abi = readJsonSync("./config/erc20.json");
  const erc20Token = new ERC20Token(
    web3,
    erc20Abi,
    oToken.parameters.underlying,
    account
  );

  const comptrollerAbi = readJsonSync("./config/comptroller.json");
  const comptroller = new Comptroller(
    web3,
    comptrollerAbi,
    oToken.parameters.comptroller,
    account
  );

  // load price feed object
  const priceOracleAbi = readJsonSync("./config/priceOracle.json");
  const priceOracle = new PriceOracle(
    web3,
    priceOracleAbi,
    config.priceOracle,
    account
  );

  // actual tests
  const markets = [config.oTokens.oKono.address];
  await enterMarkets(account, markets, comptroller);
  await borrow(account, oToken, erc20Token, priceOracle, comptroller, 50);
  await repayBorrow(account, oToken, erc20Token);
}

main()
  .then(() => exit(0))
  .catch((e) => {
    console.log(e);
    exit(1);
  });
