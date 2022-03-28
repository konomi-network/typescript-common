import { Client, TxnCallbacks } from './client';
import { TxnOptions } from 'options';

class ERC20Token extends Client {
  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }

  public async symbol(): Promise<string> {
    try {
      const symbol = await this.contract.methods.symbol().call();
      return symbol;
    } catch (error) {
      return ''
    }
  }

  public async allowance(owner: string, spender: string): Promise<number> {
    return this.contract.methods.allowance(owner, spender).call();
  }

  public async increaseAllowance(
    spender: string,
    addedValue: string,
    options: TxnOptions,
    ...callbacks: TxnCallbacks
  ): Promise<void> {
    const method = this.contract.methods.increaseAllowance(spender, addedValue);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }
}

export default ERC20Token;
export { ERC20Token };
