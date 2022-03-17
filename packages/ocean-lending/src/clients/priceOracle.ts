import { Client } from './client';

class PriceOracleAdaptor extends Client {
  private readonly decimals = 1e18;

  public async getUnderlyingPrice(tokenAddress: string): Promise<number> {
    const price = await this.contract.methods.getUnderlyingPrice(tokenAddress).call();
    return price / this.decimals;
  }
}

export default PriceOracleAdaptor;
export { PriceOracleAdaptor as PriceOracleAdaptor };
