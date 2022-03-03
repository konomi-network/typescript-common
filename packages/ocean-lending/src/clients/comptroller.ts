import { Client } from './client';
import { TxnOptions } from '../options';

export class Comptroller extends Client {
  private readonly decimals = 1e18;

  public async enterMarkets (
    markets: string[],
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.enterMarkets(markets);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async getAccountLiquidity (address: string): Promise<number> {
    const { 1: liquidity } = await this.contract.methods
      .getAccountLiquidity(address)
      .call();
    return liquidity / this.decimals;
  }

  public async markets (address: string): Promise<number> {
    const { 1: collateralFactor } = await this.contract.methods
      .markets(address)
      .call();
    return (collateralFactor / this.decimals) * 100;
  }
}
