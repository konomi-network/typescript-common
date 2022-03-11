import { Client } from "./client";
import { TxnOptions } from "../options";

export class Comptroller extends Client {
  private readonly decimals = 1e18;

  public async enterMarkets(
    markets: string[],
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.enterMarkets(markets);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async getAccountLiquidity(address: string): Promise<number> {
    const { 1: liquidity } = await this.contract.methods
      .getAccountLiquidity(address)
      .call();
    return liquidity / this.decimals;
  }

  public async markets(address: string): Promise<number> {
    const { 1: collateralFactor } = await this.contract.methods
      .markets(address)
      .call();
    return (collateralFactor / this.decimals) * 100;
  }

  /*
   * The additional collateral given to liquidators as an incentive to perform liquidation of underwater accounts.
   * For example, if the liquidation incentive is 1.1, liquidators receive an extra 10% of the borrowers collateral for every unit they close.
   */
  public async liquidationIncentive(): Promise<BigInt> {
    const incentive = await this.contract.methods
      .liquidationIncentiveMantissa()
      .call();
    return BigInt(incentive);
  }

  /**
   * A cToken's collateral factor can range from 0-90%
   * represents the proportionate increase in liquidity that an account receives by minting the cToken
   */
  public async collateralFactor(address: string): Promise<number> {
    const { 1: factor } = await this.contract.methods.markets(address).call();
    return (factor / this.decimals) * 100;
  }

  public async closeFactor(): Promise<number> {
    const factor = await this.contract.methods.closeFactorMantissa().call();
    return (factor / this.decimals) * 100;
  }
}
