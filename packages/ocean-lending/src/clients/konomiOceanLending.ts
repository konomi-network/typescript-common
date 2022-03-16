import { Client } from './client';
import { TxnOptions } from '../options';
import { PoolConfig } from '../config';
import { OceanEncoder } from '../encoding';

class KonomiOceanLending extends Client {
  public async create(
    poolData: PoolConfig,
    leasePeriod: BigInt,
    onBehalfOf: string,
    options: TxnOptions
  ): Promise<void> {
    const bytes = OceanEncoder.encode(poolData);
    const method = this.contract.methods.create(bytes, leasePeriod, onBehalfOf);
    await this.send(method, await this.prepareTxn(method), options, (receipt) => {
      console.log(`receipt: ${receipt}`);
    });
  }

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

  public async withdraw(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods._withdraw(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setKonoPerBlock(konoPerBlock: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setKonoPerBlock(konoPerBlock);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setMinLeasePeriod(minLeasePeriod: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setMinLeasePeriod(minLeasePeriod);
    await this.send(method, await this.prepareTxn(method), options);
  }
}

export default KonomiOceanLending;
export { KonomiOceanLending };
