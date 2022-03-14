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

export class IntegrationClient {
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
