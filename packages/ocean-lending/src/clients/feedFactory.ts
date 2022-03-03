import { Client } from './client';

export class FeedFactory extends Client {
  public async getFeed (subscriptionId: string): Promise<BigInt> {
    const b = await this.contract.methods.getFeed(subscriptionId).call();
    console.log(b);
    return BigInt(b);
  }

  public async feeds (subscriptionId: string): Promise<BigInt> {
    const b = await this.contract.methods.feeds(subscriptionId).call();
    console.log(b);
    return BigInt(b);
  }
}
