import { exit } from "process";
import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "clients/erc20Token";
import { OToken } from "clients/oToken";
import { Comptroller } from "clients/comptroller";
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  ONE_ETHER,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { PriceOracle } from "clients/priceOracle";
import { JumpInterestV2 } from "clients/jumpInterestV2";

async function multiplierPerBlock(jumpInterestV2: JumpInterestV2) {
  console.log("==== multiplierPerBlock ====");
  const multiplier = await jumpInterestV2.multiplierPerBlock();
  console.log(`multiplierPerBlock: ${multiplier}`);
  console.log("==== multiplierPerBlock ====");
}

async function baseRatePerBlock(jumpInterestV2: JumpInterestV2) {
  console.log("==== baseRatePerBlock ====");
  const rate = await jumpInterestV2.baseRatePerBlock();
  console.log(`baseRatePerBlock: ${rate.valueOf() / ONE_ETHER}%`);
  console.log("==== baseRatePerBlock ====");
}

async function jumpMultiplierPerBlock(jumpInterestV2: JumpInterestV2) {
  console.log("==== jumpMultiplierPerBlock ====");
  const jumpMultiplier = await jumpInterestV2.jumpMultiplierPerBlock();
  console.log(`jumpMultiplierPerBlock: ${jumpMultiplier}`);
  console.log("==== jumpMultiplierPerBlock ====");
}

async function kink(jumpInterestV2: JumpInterestV2) {
  console.log("==== kink ====");
  const rate = await jumpInterestV2.kink();
  console.log(`kink: ${rate}`);
  console.log("==== kink ====");
}

async function getBorrowRate(jumpInterestV2: JumpInterestV2, oToken: OToken) {
  console.log("==== getBorrowRate ====");
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves(),
  ]);
  const rate = await jumpInterestV2.getBorrowRate(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, borrowRate: ${
      rate.valueOf() / ONE_ETHER
    }%`
  );
  console.log("==== getBorrowRate ====");
}

async function getSupplyRate(
  jumpInterestV2: JumpInterestV2,
  oToken: OToken,
  reserveFactorMantissa: BigInt
) {
  console.log("==== getSupplyRate ====");
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves(),
  ]);
  const rate = await jumpInterestV2.getSupplyRate(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, reserveFactorMantissa: ${reserveFactorMantissa} supplyRate: ${
      rate.valueOf() / ONE_ETHER
    }%`
  );
  console.log("==== getSupplyRate ====");
}

async function getBorrowRateAPY(
  jumpInterestV2: JumpInterestV2,
  oToken: OToken,
  blockTime: number
) {
  console.log("==== getBorrowRateAPY ====");
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves(),
  ]);
  const rate = await jumpInterestV2.getBorrowRateAPY(oToken, blockTime);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, BorrowRateAPY: ${
      rate.valueOf() / ONE_ETHER
    }%`
  );
  console.log("==== getBorrowRateAPY ====");
}

async function getSupplyRateAPY(
  jumpInterestV2: JumpInterestV2,
  oToken: OToken,
  blockTime: number
) {
  console.log("==== getSupplyRateAPY ====");
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves(),
  ]);
  const rate = await jumpInterestV2.getSupplyRateAPY(oToken, blockTime);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, supplyRateAPY: ${
      rate.valueOf() / ONE_ETHER
    }%`
  );
  console.log("==== getSupplyRateAPY ====");
}

async function main() {
  // const config = readJsonSync('./config/config.json');
  const config = readJsonSync("../test-config/config.json");

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

  // load JumpInterestV2 object
  const jumpInterestV2Abi = readJsonSync("./config/jumpInterestV2.json");
  const jumpInterestV2 = new JumpInterestV2(
    web3,
    jumpInterestV2Abi,
    config.JumpInterestV2.address,
    account
  );

  // actual tests
  await multiplierPerBlock(jumpInterestV2);
  await baseRatePerBlock(jumpInterestV2);
  await jumpMultiplierPerBlock(jumpInterestV2);
  await kink(jumpInterestV2);

  const cash = await oToken.getCash();
  const totalBorrows = await oToken.totalBorrowsCurrent();
  const totalSupply = await oToken.totalSupply();
  const totalReserves = await oToken.totalReserves();
  const reserveFactorMantissa = await oToken.reserveFactorMantissa();
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalSupply: ${totalSupply}, reserveFactorMantissa: ${reserveFactorMantissa}, totalReserves: ${totalReserves}`
  );
  const blockTime = 15;

  await getBorrowRate(jumpInterestV2, oToken);
  await getBorrowRateAPY(jumpInterestV2, oToken, blockTime);
  await getSupplyRate(jumpInterestV2, oToken, reserveFactorMantissa);
  await getSupplyRateAPY(jumpInterestV2, oToken, blockTime);
}

main();
