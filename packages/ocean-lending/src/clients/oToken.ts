import Web3 from 'web3';
import { Client, TAccount, TxnCallbacks } from './client';
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

  /**
   * Reference in compound docs: https://compound.finance/docs.
   * All oTokens have 8 decimal places.
   * Underlying tokens have 18 Decimal places.
   */
  private readonly COMPOUND_BASE_DECIMALS = 18
  private readonly UNDERLYING_DECIMALS = 18;
  private readonly OTOKEN_DECIMALS = 8;


  private readonly underlyingMantissa = 1e18;

  constructor(web3: Web3, abi: any, address: string, account: TAccount, parameters: OTokenParameter) {
    super(web3, abi, address, account);
    this.parameters = parameters;
  }

  public async mint(amount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.mint(amount);
    return this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async redeem(amount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.redeem(amount);
    return this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async redeemUnderlying(amount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.redeemUnderlying(amount);
    return this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async borrow(amount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.borrow(amount);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async repayBorrow(amount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.repayBorrow(amount);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async borrowRatePerBlock(): Promise<number> {
    const borrowRate = await this.contract.methods.borrowRatePerBlock().call();
    return borrowRate / this.underlyingMantissa;
  }

  public async supplyRatePerBlock(): Promise<number> {
    const supplyRate = await this.contract.methods.supplyRatePerBlock().call();
    return supplyRate / this.underlyingMantissa;
  }

  public async borrowRatePerYear(blockTime: number): Promise<number> {
    const borrowRate = await this.borrowRatePerBlock();
    return OToken.ratePerBlockToAPY(borrowRate, blockTime);
  }

  public async supplyRatePerYear(blockTime: number): Promise<number> {
    const supplyRate = await this.supplyRatePerBlock();
    return OToken.ratePerBlockToAPY(supplyRate, blockTime);
  }

  public async borrowBalanceCurrent(address: string): Promise<BigInt> {
    const balance = await this.contract.methods.borrowBalanceCurrent(address).call();
    return BigInt(balance);
  }

  public async approve(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.approve(this.address, amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async balanceOf(address: string): Promise<BigInt> {
    const b = await this.contract.methods.balanceOf(address).call();
    return BigInt(b);
  }

  public async exchangeRate(): Promise<BigInt> {
    const rate = await this.contract.methods.exchangeRateCurrent().call();
    return BigInt(rate);
  }

  public async underlying(): Promise<string> {
    return this.contract.methods.underlying().call();
  }

  public async underlyingBalanceCurrent(address: string): Promise<BigInt> {
    const balance = await this.contract.methods.balanceOfUnderlying(address).call();
    return BigInt(balance);
  }

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
  public async totalSupply(): Promise<BigInt> {
    const supply = this.contract.methods.totalSupply().call();
    return BigInt(supply);
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

  public static ratePerBlockToAPY(rate: BigInt | string | number, blockTime: number): number {
    const daysPerYear = 365;
    const blocksPerDay = parseInt(86400 / blockTime + '');
    const APY = (Math.pow(Number(rate) * blocksPerDay + 1, daysPerYear) - 1) * 100;
    return APY;
  }

  public async interestRateModel(): Promise<string> {
    return this.contract.methods.interestRateModel().call();
  }

  /**
   * get the interest of total borrowBalance.
   * @param address address of user to operation.
   * @returns the decimals of interest is same as underlying asset. 
   */
  public async borrowInterest(address: string): Promise<BigInt> {
    const [exchangeRateCurrent, borrowAmount] = await Promise.all([this.exchangeRate(), this.borrowBalanceCurrent(address)]);

    const mantissa = this.COMPOUND_BASE_DECIMALS + this.UNDERLYING_DECIMALS - this.OTOKEN_DECIMALS;
    const underlyingTokensAfter = borrowAmount.valueOf() * exchangeRateCurrent.valueOf() / BigInt(Math.pow(10, mantissa));
    const interest = underlyingTokensAfter - borrowAmount.valueOf();
    return interest;
  }

  /**
   * get the interest of total supply.
   * @param address address of user to operation.
   * @returns the decimals of interest is same as underlying asset. 
   */
  public async supplyInterest(address: string): Promise<BigInt> {
    const [exchangeRateCurrent, supplyAmount] = await Promise.all([this.exchangeRate(), this.balanceOf(address)]);

    const mantissa = this.COMPOUND_BASE_DECIMALS + this.UNDERLYING_DECIMALS - this.OTOKEN_DECIMALS;
    const underlyingTokensAfter = supplyAmount.valueOf() * exchangeRateCurrent.valueOf() / BigInt(Math.pow(10, mantissa));
    const interest = underlyingTokensAfter - supplyAmount.valueOf();
    return interest;
  }

}

export default OToken;
export { OToken };
