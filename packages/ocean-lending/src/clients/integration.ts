import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "./erc20Token";
import { OToken, OTokenParameter } from "./oToken";
import { Comptroller } from "./comptroller";
import { JumpInterestV2 } from "./jumpInterestV2";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../utils";
import { TxnOptions } from "options";

class IntegrationClient {
  // The account to use for operations
  private account: Account;
  // The comptroller to use for operations
  private comptroller: Comptroller;
  // The jumpInterestV2 to use for operations
  private jumpInterestV2: JumpInterestV2;
  // The confirmations to use for operations
  private confirmations: TxnOptions;

  constructor(
    account: Account,
    comptroller: Comptroller,
    jumpInterestV2: JumpInterestV2,
    confirmations: TxnOptions
  ) {
    this.account = account;
    this.comptroller = comptroller;
    this.jumpInterestV2 = jumpInterestV2;
    this.confirmations = confirmations;
  }

  public async poolInfo(blockTime: number, oToken: OToken): Promise<any> {
    const [liquidity, borrowRateAPY, supplyRateAPY] = await Promise.all([
      this.comptroller.getAccountLiquidity(this.account.address),
      this.jumpInterestV2.getBorrowRateAPY(oToken, blockTime),
      this.jumpInterestV2.getSupplyRateAPY(oToken, blockTime),
    ]);

    return {
      address: oToken.address,
      liquidity: liquidity,
      borrowAPY: borrowRateAPY,
      depositAPY: supplyRateAPY,
    };
  }

  public async collateralSettings(blockTime: number): Promise<any> {
    // Not implemented in comptroller,
    const canBecollateral = true;

    const [collateralFactor, closeFactor, liquidationIncentive] =
      await Promise.all([
        this.comptroller.collateralFactor(this.account.address),
        this.comptroller.closeFactor(this.account.address),
        this.comptroller.liquidationIncentive(),
      ]);

    return {
      canBecollateral: canBecollateral,
      collateralFactor: collateralFactor,
      closeFactor: closeFactor,
      liquidationIncentive: liquidationIncentive,
    };
  }

  public async interestRateModel(blockTime: number): Promise<any> {
    const [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink] =
      await Promise.all([
        this.jumpInterestV2.baseRatePerYear(blockTime),
        this.jumpInterestV2.multiplierPerYear(blockTime),
        this.jumpInterestV2.jumpMultiplierPerYear(blockTime),
        this.jumpInterestV2.kink(),
      ]);

    return {
      baseRatePerYear: baseRatePerYear,
      multiplierPerYear: multiplierPerYear,
      jumpMultiplierPerYear: jumpMultiplierPerYear,
      kink: kink,
    };
  }
}

async function main() {
  // const config = readJsonSync('./config/config.json');
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

  const confirmations = { confirmations: 3 };

  // actual tests
  const integrationClient = new IntegrationClient(
    account,
    comptroller,
    jumpInterestV2,
    confirmations
  );
  const blockTime = 15;
  const poolInfoResponse = await integrationClient.poolInfo(blockTime, oToken);
  console.log(poolInfoResponse);

  const collateralSettingsResponse = await integrationClient.collateralSettings(
    blockTime
  );
  console.log(collateralSettingsResponse);

  const interestRateModelResponse = await integrationClient.interestRateModel(
    blockTime
  );
  console.log(interestRateModelResponse);
}

main();
