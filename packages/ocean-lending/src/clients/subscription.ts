import { TxnOptions } from "../../src/options";
import { Client } from "./client";

/**
 * Subscription contract client.
 */
export class Subscription extends Client {
  /**
   * Update the subscription status. Either suspend the subscription or enable the subscription.
   * @param subscriptionId The subscription id
   * @param suspended Whether to suspend the subscription
   */
  public async updateSubscriptionStatus(
    subscriptionId: BigInt,
    suspended: boolean,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.updateSubscriptionStatus(
      subscriptionId,
      suspended
    );
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Make the subscription with brand new data. This should be invoked by whitelisted address only.
   * @param externalStorageHash The external storage hash
   * @param sourceCount The number of data sources count
   * @param leasePeriod The lease period of the subscription
   * @param clientType  The client type of the subscription
   * @param onBehalfOf Making the subscription on behalf of address
   */
  public async newSubscription(
    externalStorageHash: string,
    sourceCount: BigInt,
    leasePeriod: BigInt,
    clientType: number,
    onBehalfOf: string
  ): Promise<[BigInt, string]> {
    const [subscriptionId, feedContract] = await this.contract.methods
      .newSubscription(
        externalStorageHash,
        sourceCount,
        leasePeriod,
        clientType,
        onBehalfOf
      )
      .call();
    return [subscriptionId, feedContract];
  }

  /**
   * Make the subscription by existing live subscriptions
   * @param subscriptionId The id of the subscription to follow
   * @param leasePeriod The lease period of the subscription
   */
  public async subscribeByExisting(
    subscriptionId: BigInt,
    leasePeriod: BigInt,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.subscribeByExisting(
      subscriptionId,
      leasePeriod
    );
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Extend the subscription identified by on chain subscription id
   * @param subscriptionId The id of the subscription to follow
   * @param extendPeriod The period to extend the subscription
   */
  public async extendSubscription(
    subscriptionId: BigInt,
    extendPeriod: BigInt,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.extendSubscription(
      subscriptionId,
      extendPeriod
    );
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Returns the minimal lease period required to make a new subscription
   */
  public async minLeasePeriod(): Promise<BigInt> {
    const leasePeriod = await this.contract.methods.minLeasePeriod().call();
    return BigInt(leasePeriod);
  }
}
