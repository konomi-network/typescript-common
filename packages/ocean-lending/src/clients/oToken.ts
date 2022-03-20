/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';
import { Account } from 'web3-core';
import { Client } from './client';
import { TxnOptions } from '../options';

export interface OTokenParameter {
  initialExchangeRate: number;
  underlying: string;
  comptroller: string;
  priceOracle: string;
  decimals: number;
}
class OToken extends Client {
  readonly parameters: OTokenParameter;

  private readonly underlyingDecimals = 18;

  constructor(web3: Web3, abi: any, address: string, account: Account, parameters: OTokenParameter) {
    super(web3, abi, address, account);
    this.parameters = parameters;
  }

  public async mint(amount: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.mint(amount.toString());
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async redeem(amount: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.redeem(amount.toString());
    let failed = null;
    await this.send(method, await this.prepareTxn(method), options, (receipt: any) => {
      failed = this.detectFailedEvents(receipt);
    });

    if (failed != null) {
      throw new Error(failed);
    }
  }

  public async borrowRatePerBlock(): Promise<BigInt> {
    const borrowRate = await this.contract.methods.borrowRatePerBlock().call();
    return BigInt(borrowRate / Math.pow(10, this.underlyingDecimals));
  }

  public async borrow(amount: number, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.borrow(amount.toString());
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async borrowBalanceCurrent(address: string): Promise<number> {
    return this.contract.methods.borrowBalanceCurrent(address).call();
  }

  public async approve(amount: number, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.approve(this.address, amount.toString());
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async repayBorrow(amount: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.repayBorrow(amount.toString());
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }

  public async exchangeRate(): Promise<number> {
    return this.contract.methods.exchangeRateCurrent().call();
  }

  // public convertFromUnderlying(amount: BigInt): BigInt {

  // }

  private detectFailedEvents(events: any) {
    Object.keys(events).forEach((key) => {
      if (key === 'Failure') {
        const error = events.Failure.returnValues;
        if (error.error != 0) {
          return error.info;
        } else {
          return null;
        }
      }
    });
  }

  /**
   * Total Borrows is the amount of underlying currently loaned out by the market,
   * and the amount upon which interest is accumulated to suppliers of the market.
   */
  public async totalBorrowsCurrent(): Promise<BigInt> {
    return this.contract.methods.totalBorrowsCurrent().call();
  }

  /**
   * Total Supply is the number of tokens currently in circulation in this cToken market.
   * It is part of the EIP-20 interface of the cToken contract.
   */
  public async totalSupply(): Promise<number> {
    return this.contract.methods.totalSupply().call();
  }

  /**
   * Cash is the amount of underlying balance owned by this cToken contract.
   */
  public async getCash(): Promise<BigInt> {
    return this.contract.methods.getCash().call();
  }

  /**
   * The total amount of reserves held in the market.
   */
  public async totalReserves(): Promise<BigInt> {
    return this.contract.methods.totalReserves().call();
  }

  /**
   * The reserve factor defines the portion of borrower interest that is converted into reserves.
   */
  public async reserveFactorMantissa(): Promise<BigInt> {
    return this.contract.methods.reserveFactorMantissa().call();
  }
}

export default OToken;
export { OToken };
