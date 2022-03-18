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
    const bytes = `0x${OceanEncoder.encode(poolData).toString('hex')}`;
    const method = this.contract.methods.create(bytes, leasePeriod, onBehalfOf);
    await this.send(method, await this.prepareTxn(method), options, (receipt) => {
      console.log(`receipt: ${receipt}`);
    });
  }

  public async grantInvokerRole(account: string, options: TxnOptions): Promise<void> {
    const invokerRole = await this.invokerRole();
    const method = this.contract.methods.grantRole(invokerRole, account);
    await this.send(method, await this.prepareTxn(method), options);
  }

  private async invokerRole(): Promise<string> {
    return this.contract.methods.INVOKER_ROLE().call();
  }

  public async derivePayable(leasePeriod: BigInt): Promise<BigInt> {
    return this.contract.methods.derivePayable(leasePeriod).call();
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

  public async withdraw(amount: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods._withdraw(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setKonoPerBlock(konoPerBlock: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setKonoPerBlock(konoPerBlock);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setMinLeasePeriod(minLeasePeriod: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setMinLeasePeriod(minLeasePeriod);
    await this.send(method, await this.prepareTxn(method), options);
  }
}

export default KonomiOceanLending;
export { KonomiOceanLending };
