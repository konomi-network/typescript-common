import { Client } from './client';

class ERC20Token extends Client {
  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }

  public async symbol(): Promise<string> {
    return this.contract.methods.symbol().call();
  }
}

export default ERC20Token;
export { ERC20Token };
