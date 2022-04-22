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

export interface OTokenDetails {
  supplyAPY: number;
  borrowAPY: number;
  supplyAmount: number;
  borrowAmount: number;
}

class OToken extends Client {
  readonly parameters: OTokenParameter;

  /**
   * Reference in compound docs: https://compound.finance/docs.
   * All oTokens have 8 decimal places.
   * Underlying tokens have 18 Decimal places.
   */
  public static COMPOUND_BASE_DECIMALS = 18;

  public static UNDERLYING_DECIMALS = 18;

  public static OTOKEN_DECIMALS = 8;

  public static UNDERLYING_MANTISSA = 1e18;

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

  /**
   * A liquidator may close up to a certain fixed percentage (i.e. close factor) of any individual outstanding borrow of the underwater account.
   * @param borrowerAddress The account with negative account liquidity that shall be liquidated.
   * @param repayAmount The amount of the borrowed asset to be repaid and converted into collateral, specified in units of the underlying borrowed asset.
   * @param collateralAddress The address of the cToken currently held as collateral by a borrower, that the liquidator shall seize.
   */
  public async liquidateBorrow(borrowerAddress: string, repayAmount: string, collateralAddress: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.liquidateBorrow(borrowerAddress, repayAmount, collateralAddress);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  /**
   * Sender repays a borrow belonging to borrower
   * @param borrowerAddress the account with the debt being payed off
   * @param repayAmount The amount to repay
   */
  public async repayBorrowBehalf(borrowerAddress: string, repayAmount: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.repayBorrowBehalf(borrowerAddress, repayAmount);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  public async borrowRatePerBlock(): Promise<number> {
    const borrowRate = await this.contract.methods.borrowRatePerBlock().call();
    return borrowRate / OToken.UNDERLYING_MANTISSA;
  }

  public async supplyRatePerBlock(): Promise<number> {
    const supplyRate = await this.contract.methods.supplyRatePerBlock().call();
    return supplyRate / OToken.UNDERLYING_MANTISSA;
  }

  public async borrowAPY(blockTime: number): Promise<number> {
    const borrowRate = await this.borrowRatePerBlock();
    return OToken.ratePerBlockToAPY(borrowRate, blockTime);
  }

  public async supplyAPY(blockTime: number): Promise<number> {
    const supplyRate = await this.supplyRatePerBlock();
    return OToken.ratePerBlockToAPY(supplyRate, blockTime);
  }

  public async approve(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.approve(this.address, amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async balanceOf(address: string): Promise<number> {
    const b = await this.contract.methods.balanceOf(address).call();
    return Number(b);
  }

  public async exchangeRate(): Promise<number> {
    const rate = await this.contract.methods.exchangeRateCurrent().call();
    return Number(rate);
  }

  public async underlying(): Promise<string> {
    return this.contract.methods.underlying().call();
  }

  public async underlyingBalanceCurrent(address: string): Promise<string> {
    const balance = await this.contract.methods.balanceOfUnderlying(address).call();
    return balance;
  }

  /**
   * Total Supply is the number of tokens currently in circulation in this cToken market.
   * It is part of the EIP-20 interface of the cToken contract.
   */
  public async totalSupply(): Promise<number> {
    const supply = await this.contract.methods.totalSupply().call();
    return Number(supply);
  }

  public async totalBorrows(): Promise<number> {
    const supply = await this.contract.methods.totalBorrows().call();
    return Number(supply);
  }

  /**
   * Cash is the amount of underlying balance owned by this cToken contract.
   */
  public async getCash(): Promise<number> {
    const cash = await this.contract.methods.getCash().call();
    return Number(cash);
  }

  /**
   * The total amount of reserves held in the market.
   */
  public async totalReserves(): Promise<number> {
    const totalReserves = await this.contract.methods.totalReserves().call();
    return Number(totalReserves);
  }

  /**
   * The reserve factor defines the portion of borrower interest that is converted into reserves.
   */
  public async reserveFactorMantissa(): Promise<BigInt> {
    const reserveFactorMantissa = await this.contract.methods.reserveFactorMantissa().call();
    return BigInt(reserveFactorMantissa);
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
   */
  public async accountBorrowBalance(address: string): Promise<number> {
    return Number(await this.contract.methods.borrowBalanceStored(address).call());
  }

  /**
   * get the interest of total supply.
   * @param address address of user to operation.
   */
  public async accountSupplyBalance(address: string): Promise<number> {
    const [exchangeRateCurrent, supplyAmount] = await Promise.all([this.exchangeRate(), this.balanceOf(address)]);
    const mantissa = OToken.COMPOUND_BASE_DECIMALS + OToken.UNDERLYING_DECIMALS - OToken.OTOKEN_DECIMALS;
    return (supplyAmount * exchangeRateCurrent) / Math.pow(10, mantissa);
  }

  public async getOTokenSummary(blockTime: number, account: string): Promise<OTokenDetails> {
    const [supplyAPY, borrowAPY, supplyAmount, borrowAmount] = await Promise.all([
      this.supplyAPY(blockTime),
      this.borrowAPY(blockTime),
      this.accountSupplyBalance(account),
      this.accountBorrowBalance(account)
    ]);

    return {
      supplyAPY,
      borrowAPY,
      supplyAmount,
      borrowAmount
    };
  }
}

export default OToken;
export { OToken };
