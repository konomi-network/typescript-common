import { Client } from './client';

class ERC20Token extends Client {
  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }
}

export default ERC20Token;
export { ERC20Token };
