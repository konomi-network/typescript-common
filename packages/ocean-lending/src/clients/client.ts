/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Account, TransactionReceipt } from 'web3-core';
import { TxnOptions } from '../options';
// import logger from "../logger";

const PENDING = 'pending';
export type TAccount = Account | { address: string };
export type TxnCallbacks = [
  ((txnHash: string) => any)?,
  ((receipt: TransactionReceipt) => any)?,
  ((error: Error, receipt: TransactionReceipt) => any)?
];

/**
 * The client class for Konomi Protocol.
 */
class Client {
  // The web3 instance
  protected web3: Web3;

  // The contract on chain
  protected contract: Contract;

  // The account to use for operations
  protected account?: TAccount;

  constructor(web3: Web3, abi: any, address: string, account?: TAccount) {
    this.web3 = web3;
    this.contract = new web3.eth.Contract(abi, address);
    this.account = account;
  }

  public connect(account: Account): void {
    this.account = account;
  }

  /**
   * Get token address from contract
   * @returns The token address
   */
  get address(): string {
    return this.contract.options.address;
  }

  /**
   * Prepare the txn data for payable methods.
   * @param method The method object
   * @returns The prepared txn data.
   */
  protected async prepareTxn(method: any): Promise<any> {
    const txn: any = {
      from: this.account!.address,
      nonce: await this.deduceNonce()
    };

    txn.gas = await this.estimateGas(method, txn);
    return txn;
  }

  protected async send(
    method: any,
    txn: any,
    options: TxnOptions,
    txnHashCallback?: (txnHash: string) => any,
    confirmationCallback?: (receipt: TransactionReceipt) => any,
    errorCallback?: (error: Error, receipt: TransactionReceipt) => any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      method
        .send(txn)
        .on('transactionHash', (txnHash: any) => {
          if (txnHashCallback) {
            txnHashCallback(txnHash);
          }
          // logger.info('transaction hash for method: %o is %o', method, txnHash);
        })
        .on('confirmation', (confirmations: number, receipt: any) => {
          // logger.debug('confirmations: %o receipt: %o latestBlockHash: %o', confirmations, receipt, latestBlockHash);
          if (confirmations === options.confirmations) {
            if (confirmationCallback) {
              confirmationCallback(receipt);
            }
            return resolve();
          }
        })
        .on('error', (error: Error, receipt: any) => {
          if (errorCallback) {
            errorCallback(error, receipt);
          }
          // logger.warn('submit for error: %o receipt: %o', error, receipt);
          return reject(error);
        });
    });
  }

  private async deduceNonce(): Promise<number> {
    return this.web3.eth.getTransactionCount(this.account!.address, PENDING);
  }

  private async estimateGas(method: any, txn: any): Promise<number> {
    return method.estimateGas(txn);
  }
}

export default Client;
export { Client };
