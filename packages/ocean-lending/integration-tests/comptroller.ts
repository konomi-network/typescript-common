import { expect } from 'chai';
import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "../src/clients/erc20Token";
import { OToken } from "../src/clients/oToken";
import { Comptroller } from "../src/clients/comptroller";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { PriceOracle } from "../src/clients/priceOracle";
import { JumpInterestV2 } from "../src/clients/jumpInterestV2";

async function liquidationIncentive(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  console.log("==== liquidationIncentive ====");
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const incentive = await comptroller.liquidationIncentive();
  console.log(
    "erc20:",
    erc20Before,
    " oToken",
    oTokenBefore,
    "incentive:",
    incentive
  );
  console.log("==== liquidationIncentive ====");
}

async function collateralFactor(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  console.log("==== collateralFactor ====");
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const factor = await comptroller.collateralFactor(account.address);
  console.log(
    `erc20: ${erc20Before}, oToken: ${oTokenBefore}, collateralFactor: ${factor}%`
  );
  console.log("==== collateralFactor ====");
}

/**
 * The percent, ranging from 0% to 100%, of a liquidatable account's borrow that can be repaid in a single liquidate transaction.
 */
async function closeFactor(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  console.log("==== closeFactor ====");
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const factor = await comptroller.closeFactor(account.address);
  console.log(
    `erc20: ${erc20Before}, oToken: ${oTokenBefore}, closeFactor: ${factor}%`
  );
  console.log("==== closeFactor ====");
}

async function totalLiquidaity(
  web3: Web3,
  oTokenAbi: any,
  account: Account,
  config: any,
  comptroller: Comptroller,
  priceOracle: PriceOracle
) {
  const tokenAddresses = await comptroller.allMarkets();
  let totalLiquidaity = 0;
  for (const tokenAddress of tokenAddresses) {
    const oToken = new OToken(
      web3,
      oTokenAbi,
      tokenAddress,
      account,
      config.oTokens.oKono.parameters // @todo may be use relate tokenAddress
    );
    const supply = await oToken.totalSupply();
    const price = await priceOracle.getUnderlyingPrice(tokenAddress);
    totalLiquidaity += supply * price;
    console.log("tokenAddress:", tokenAddress);
    console.log("supply:", supply);
    console.log("price:", price);
  }
  console.log("totalLiquidaity:", totalLiquidaity);
  return totalLiquidaity;
}

async function minBorrowAPY(
  web3: Web3,
  oTokenAbi: any,
  account: Account,
  config: any,
  comptroller: Comptroller,
  jumpInterestV2: JumpInterestV2
) {
  const blockTime = 15;
  const tokenAddresses = await comptroller.allMarkets();
  let min: BigInt = BigInt(-1);
  for (const tokenAddress of tokenAddresses) {
    const oToken = new OToken(
      web3,
      oTokenAbi,
      tokenAddress,
      account,
      config.oTokens.oKono.parameters // @todo may be use relate tokenAddress
    );
    const borrowRateAPY = await jumpInterestV2.getBorrowRateAPY(
      oToken,
      blockTime
    );

    if (min == BigInt(-1) || min > borrowRateAPY) {
      min = borrowRateAPY;
    }
  }
  console.log("minBorrowAPY:", min);
  return min;
}

async function minSupplyAPY(
  web3: Web3,
  oTokenAbi: any,
  account: Account,
  config: any,
  comptroller: Comptroller,
  jumpInterestV2: JumpInterestV2
) {
  const blockTime = 15;
  const tokenAddresses = await comptroller.allMarkets();
  let min: BigInt = BigInt(-1);
  for (const tokenAddress of tokenAddresses) {
    const oToken = new OToken(
      web3,
      oTokenAbi,
      tokenAddress,
      account,
      config.oTokens.oKono.parameters // @todo may be use relate tokenAddress
    );
    const borrowRateAPY = await jumpInterestV2.getSupplyRateAPY(
      oToken,
      blockTime
    );

    if (min == BigInt(-1) || min > borrowRateAPY) {
      min = borrowRateAPY;
    }
  }
  console.log("minSupplyAPY:", min);
  return min;
}

describe("Comptroller", async () => {
  const config = readJsonSync("./config/config.json");
  const oTokenAbi = readJsonSync("./config/oToken.json");
  const erc20Abi = readJsonSync("./config/erc20.json");
  const comptrollerAbi = readJsonSync("./config/comptroller.json");
  const priceOracleAbi = readJsonSync("./config/priceOracle.json");
  const jumpInterestV2Abi = readJsonSync("./config/jumpInterestV2.json");

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oToken: OToken;
  let erc20Token: ERC20Token;
  let comptroller: Comptroller;
  let priceOracle: PriceOracle;
  let jumpInterestV2: JumpInterestV2;

  before(async () => {
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
    oToken = new OToken(
      web3,
      oTokenAbi,
      config.oTokens.oKono.address,
      account,
      config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    erc20Token = new ERC20Token(
      web3,
      erc20Abi,
      oToken.parameters.underlying,
      account
    );

    comptroller = new Comptroller(
      web3,
      comptrollerAbi,
      oToken.parameters.comptroller,
      account
    );

    // load price feed object
    priceOracle = new PriceOracle(
      web3,
      priceOracleAbi,
      config.priceOracle,
      account
    );

    // load JumpInterestV2 object
    jumpInterestV2 = new JumpInterestV2(
      web3,
      jumpInterestV2Abi,
      config.JumpInterestV2.address,
      account
    );
  });

  it("key flow test", async () => {
    // actual tests
    await liquidationIncentive(account, oToken, erc20Token, comptroller);
    await collateralFactor(account, oToken, erc20Token, comptroller);
    await closeFactor(account, oToken, erc20Token, comptroller);

    const totalLiquidaityN = await totalLiquidaity(
      web3,
      oTokenAbi,
      account,
      config,
      comptroller,
      priceOracle
    );
    expect(totalLiquidaityN).to.be.gt(0);

    const minBorrowRateAPY = await minBorrowAPY(
      web3,
      oTokenAbi,
      account,
      config,
      comptroller,
      jumpInterestV2
    );
    expect(minBorrowRateAPY > BigInt(0)).to.be.eq(true);

    const minSupplyRateAPY = await minSupplyAPY(
      web3,
      oTokenAbi,
      account,
      config,
      comptroller,
      jumpInterestV2
    );
    expect(minSupplyRateAPY > BigInt(0)).to.be.eq(true);
  });
});
