import { OToken } from "oToken";
import { Client } from "../../src/client";

/**
 * JumpInterest V2 contract client.
 */
export class JumpInterestV2 extends Client {
  private readonly decimals = 1e18;

  /*
  * The multiplier of utilization rate that gives the slope of the interest rate.
  */
  public async multiplierPerBlock(): Promise<BigInt> {
    const m = await this.contract.methods.multiplierPerBlock().call();
    return BigInt(m);
  }

  /**
   * The base interest rate which is the y-intercept when utilization rate is 0
   */
  public async baseRatePerBlock(): Promise<BigInt> {
    const b = await this.contract.methods.baseRatePerBlock().call()
    return BigInt(b);
  }

  /**
   * The multiplierPerBlock after hitting a specified utilization point
   */
  public async jumpMultiplierPerBlock(): Promise<BigInt> {
    const j = await this.contract.methods.jumpMultiplierPerBlock().call();
    return BigInt(j);
  }

  /**
   * The utilization point at which the jump multiplier is applied
  */
  public async kink(): Promise<BigInt> {
    const k = await this.contract.methods.kink().call();
    return BigInt(k);
  }

  /**
    * Calculates the current borrow interest rate per block
    * @param oToken The ocean-lending client object
    * @return The borrow rate per block (as a percentage, and scaled by 1e18)
    */
  public async getBorrowRate(oToken: OToken): Promise<BigInt> {
    const cash = await oToken.getCash();
    const borrows = await oToken.totalBorrowsCurrent();
    const reserves = await oToken.totalReserves();
    const rate = await this.contract.methods.getBorrowRate(cash, borrows, reserves).call();
    return BigInt(rate);
  }

  /**
    * Calculates the current supply interest rate per block
    * @param oToken The ocean-lending client object
    * @return The supply rate per block (as a percentage, and scaled by 1e18)
    */
  public async getSupplyRate(oToken: OToken): Promise<BigInt> {
    const cash = await oToken.getCash();
    const borrows = await oToken.totalBorrowsCurrent();
    const reserves = await oToken.totalReserves();
    const reserveFactorMantissa = await oToken.reserveFactorMantissa()
    const rate = await this.contract.methods.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa).call();
    return BigInt(rate);
  }

  /**
    * Calculates the current borrow interest rate APY
    * @param oToken The ocean-lending client object
    * @param blockTime The number of seconds per block
    * @return The borrow rate per block (as a percentage, and scaled by 1e18)
    */
  public async getBorrowRateAPY(oToken: OToken, blockTime: number): Promise<BigInt> {
    const rate = await this.getBorrowRate(oToken);
    return this.blockToYear(rate, blockTime);
  }

  /**
    * Calculates the current supply interest rate APY
    * @param oToken The ocean-lending client object
    * @param blockTime The number of seconds per block
    * @return The supply rate per block (as a percentage, and scaled by 1e18)
    */
  public async getSupplyRateAPY(oToken: OToken, blockTime: number): Promise<BigInt> {
    const rate = await this.getSupplyRate(oToken);
    return this.blockToYear(rate, blockTime);
  }

  /**
    * Convert rate per block to rate APY 
    *@param rate The rate per block
    *@param blockTime The number of seconds per block
    */
  private blockToYear(rate: BigInt, blockTime: number): BigInt {
    const blocksPerYear = 365 * 24 * 3600 / blockTime;
    const r = Number(rate) / this.decimals;
    const APY = r * blocksPerYear;
    return BigInt(APY * this.decimals);
  }
}