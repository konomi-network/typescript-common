import { Client } from './client';

export class PriceOracle extends Client {
  private readonly decimals = 1e18;

  public async getUnderlyingPrice (tokenAddress: string): Promise<number> {
    const price = await this.contract.methods
      .getUnderlyingPrice(tokenAddress)
      .call();
    return price / this.decimals;
  }
}
