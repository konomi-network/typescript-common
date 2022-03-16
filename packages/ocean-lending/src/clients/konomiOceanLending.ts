import { Client } from './client';
import { TxnOptions } from 'options';

class KonomiOceanLending extends Client {
  public async activePoolIds(): Promise<string[]> {
    return this.contract.methods.getActivePoolIds().call();
  }

  public async suspend(poolId: number, suspended: boolean, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.suspend(poolId, suspended);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async extendLease(poolId: number, extendPeriod: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.extendLease(poolId, extendPeriod);
    await this.send(method, await this.prepareTxn(method), options);
  }
}

export default KonomiOceanLending;
export { KonomiOceanLending };
