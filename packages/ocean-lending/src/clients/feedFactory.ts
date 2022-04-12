import { TxnOptions } from '../options';
import { Client } from './client';

export interface Feed {
  decials: number;
  value: BigInt;
  roundId: number;
  updatedBlock: BigInt;
}

export class FeedFactory extends Client {
  public async getFeed(subscriptionId: string): Promise<Feed> {
    const b = await this.contract.methods.getFeed(subscriptionId).call();

    return {
      decials: Number(b[0]),
      value: BigInt(b[1]),
      roundId: Number(b[2]),
      updatedBlock: BigInt(b[3])
    };
  }

  public async feeds(subscriptionId: string): Promise<BigInt> {
    const b = await this.contract.methods.feeds(subscriptionId).call();
    return BigInt(b);
  }

  public async submit(subscriptionId: string, roundId: number, value: string, options: TxnOptions): Promise<void> {
    const bytes = this.encode(roundId, value);
    const method = this.contract.methods.submit(subscriptionId, bytes);
    await this.send(method, await this.prepareTxn(method), options);
  }

  private encode(roundId: number, value: string): Buffer {
    const buf = Buffer.allocUnsafe(33);
    buf.writeUInt8(roundId, 0);

    let result = BigInt(value).toString(16);
    result = result.padStart(64, '0');

    buf.write(result, 1, 'hex');

    return buf;
  }
}
