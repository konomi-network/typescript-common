import { exit } from "process";
import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "../src/clients/erc20Token";
import { OToken } from "../src/clients/oToken";
import { Comptroller } from "../src/clients/comptroller";
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  ONE_ETHER,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { JumpInterestV2 } from "../src/clients/jumpInterestV2";

async function multiplierPerYear(
  jumpInterestV2: JumpInterestV2,
  blockTime: number
) {
  console.log("==== multiplierPerYear ====");
  const multiplier = await jumpInterestV2.multiplierPerYear(blockTime);
  console.log(`multiplierPerYear: ${multiplier}`);
  console.log("==== multiplierPerYear ====");
}

async function baseRatePerYear(
  jumpInterestV2: JumpInterestV2,
  blockTime: number
) {
  console.log("==== baseRatePerYear ====");
  const rate = await jumpInterestV2.baseRatePerYear(blockTime);
  console.log(`baseRatePerYear: ${rate.valueOf() / ONE_ETHER}%`);
  console.log("==== baseRatePerYear ====");
}

async function jumpMultiplierPerYear(
  jumpInterestV2: JumpInterestV2,
  blockTime: number
) {
  console.log("==== jumpMultiplierPerYear ====");
  const jumpMultiplier = await jumpInterestV2.jumpMultiplierPerYear(blockTime);
  console.log(`jumpMultiplierPerYear: ${jumpMultiplier}`);
  console.log("==== jumpMultiplierPerYear ====");
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
  // const config = readJsonSync("./config/config.json");
  const config = readJsonSync(
    "C:/Users/kun-d/Desktop/WFH/code/dev/client/packages/test-config/config.json"
  );

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

  // load JumpInterestV2 object
  const jumpInterestV2Abi = readJsonSync("./config/jumpInterestV2.json");
  const jumpInterestV2 = new JumpInterestV2(
    web3,
    jumpInterestV2Abi,
    config.jumpInterestV2.address,
    account
  );

  // actual tests
  const blockTime = 15;
  const cash = await oToken.getCash();
  const totalBorrows = await oToken.totalBorrowsCurrent();
  const totalSupply = await oToken.totalSupply();
  const totalReserves = await oToken.totalReserves();
  const reserveFactorMantissa = await oToken.reserveFactorMantissa();
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalSupply: ${totalSupply}, reserveFactorMantissa: ${reserveFactorMantissa}, totalReserves: ${totalReserves}`
  );

  await multiplierPerYear(jumpInterestV2, blockTime);
  await baseRatePerYear(jumpInterestV2, blockTime);
  await jumpMultiplierPerYear(jumpInterestV2, blockTime);
  await kink(jumpInterestV2);

  await getBorrowRate(jumpInterestV2, oToken);
  await getBorrowRateAPY(jumpInterestV2, oToken, blockTime);
  await getSupplyRate(jumpInterestV2, oToken, reserveFactorMantissa);
  await getSupplyRateAPY(jumpInterestV2, oToken, blockTime);
}

main();
