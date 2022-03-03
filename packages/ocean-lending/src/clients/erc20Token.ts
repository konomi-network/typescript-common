import { Client } from "./client";

export class ERC20Token extends Client {
  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }
}
