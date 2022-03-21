import Web3 from 'web3';
import { Client } from './client';

class PriceOracleAdaptor extends Client {
  private readonly decimals = 1e18;

  public async getUnderlyingPrice(tokenAddress: string): Promise<string> {
    const price = await this.contract.methods.getUnderlyingPrice(tokenAddress).call();
    return Web3.utils.fromWei(price);
  }
}

export default PriceOracleAdaptor;
export { PriceOracleAdaptor as PriceOracleAdaptor };
