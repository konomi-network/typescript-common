import { Account } from 'web3-core';
import { OToken } from './oToken';
import { Comptroller } from './comptroller';
import { JumpInterestV2 } from './jumpInterestV2';
import { TxnOptions } from '../options';

export class IntegrationClient {
  // The account to use for operations
  private account: Account;

  // The comptroller to use for operations
  private comptroller: Comptroller;

  // The jumpInterestV2 to use for operations
  private jumpInterestV2: JumpInterestV2;

  // The confirmations to use for operations
  private confirmations: TxnOptions;

  constructor(account: Account, comptroller: Comptroller, jumpInterestV2: JumpInterestV2, confirmations: TxnOptions) {
    this.account = account;
    this.comptroller = comptroller;
    this.jumpInterestV2 = jumpInterestV2;
    this.confirmations = confirmations;
  }

  /**
   * @param oToken The oToken client object
   * @param blockTime The number of seconds per block
   */
  public async poolInfo(oToken: OToken): Promise<any> {
    const [liquidity] = await Promise.all([this.comptroller.getAccountLiquidity(this.account.address)]);

    return {
      address: oToken.parameters.underlying,
      liquidity: liquidity
    };
  }

  public async collateralSettings(): Promise<any> {
    const [collateralFactor, closeFactor, liquidationIncentive] = await Promise.all([
      this.comptroller.collateralFactor(this.account.address),
      this.comptroller.closeFactor(),
      this.comptroller.liquidationIncentive()
    ]);
    const canBeCollateral = collateralFactor != 0;

    return {
      canBeCollateral,
      collateralFactor,
      closeFactor,
      liquidationIncentive
    };
  }

  public async interestRateModel(): Promise<any> {
    const [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink] = await Promise.all([
      this.jumpInterestV2.baseRatePerYear(),
      this.jumpInterestV2.multiplierPerYear(),
      this.jumpInterestV2.jumpMultiplierPerYear(),
      this.jumpInterestV2.kink()
    ]);

    return {
      baseRatePerYear,
      multiplierPerYear,
      jumpMultiplierPerYear,
      kink
    };
  }
}
