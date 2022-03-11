import { TxnOptions } from "options";
import { Client } from "./client";

export class ConfigCenter extends Client {
  public async setFeedPriceThreshold(
    feedPriceThreshold: string,
    options: TxnOptions
  ): Promise<void> {
    const method =
      this.contract.methods.setFeedPriceThreshold(feedPriceThreshold);
    await this.send(method, await this.prepareTxn(method), options);
    return;
  }

  public async setFeedTimeout(
    feedTimeout: number,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.setFeedTimeout(feedTimeout);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setAggPriceThreshold(
    aggPriceThreshold: string,
    options: TxnOptions
  ): Promise<void> {
    const method =
      this.contract.methods.setAggPriceThreshold(aggPriceThreshold);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setAggBlockThreshold(
    aggBlockThreshold: string,
    options: TxnOptions
  ): Promise<void> {
    const method =
      this.contract.methods.setAggBlockThreshold(aggBlockThreshold);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setSubmittersThreshold(
    submittersThreshold: string,
    options: TxnOptions
  ): Promise<void> {
    const method =
      this.contract.methods.setSubmittersThreshold(submittersThreshold);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async get(field: string): Promise<string> {
    return this.contract.methods[field]().call();
  }
}
