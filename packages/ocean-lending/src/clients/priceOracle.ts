import { Client } from './client';

class PriceOracle extends Client {
  private readonly decimals = 1e18;

  public async getUnderlyingPrice(tokenAddress: string): Promise<number> {
    const price = await this.contract.methods.getUnderlyingPrice(tokenAddress).call();
    return price / this.decimals;
  }
}

export default PriceOracle;
export { PriceOracle };
