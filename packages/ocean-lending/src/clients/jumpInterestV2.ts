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
    * @param cash The total amount of cash the market has
    * @param borrows The total amount of borrows the market has outstanding
    * @param reserves The total amount of reserves the market has
    * @return The borrow rate per block (as a percentage, and scaled by 1e18)
    */
  public async getBorrowRate(cash: BigInt, borrows: BigInt, reserves: BigInt): Promise<BigInt> {
    const rate = await this.contract.methods.getBorrowRate(cash, borrows, reserves).call();
    return BigInt(rate);
  }

  /**
    * Calculates the current supply interest rate per block
    * @param cash The total amount of cash the market has
    * @param borrows The total amount of borrows the market has outstanding
    * @param reserves The total amount of reserves the market has
    * @param reserveFactorMantissa The current reserve factor the market has
    * @return The supply rate per block (as a percentage, and scaled by 1e18)
    */
  public async getSupplyRate(cash: BigInt, borrows: BigInt, reserves: BigInt, reserveFactorMantissa: BigInt): Promise<BigInt> {
    const rate = await this.contract.methods.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa).call();
    return BigInt(rate);
  }

  /**
    * Calculates the current borrow interest rate APY
    * @param cash The total amount of cash the market has
    * @param borrows The total amount of borrows the market has outstanding
    * @param reserves The total amount of reserves the market has
    * @param blockTime The number of seconds per block
    * @return The borrow rate per block (as a percentage, and scaled by 1e18)
    */
  public async getBorrowRateAPY(cash: BigInt, borrows: BigInt, reserves: BigInt, blockTime: number): Promise<BigInt> {
    const rate = await this.getBorrowRate(cash, borrows, reserves);
    return this.blockToYear(rate, blockTime);
  }

  /**
    * Calculates the current supply interest rate APY
    * @param cash The total amount of cash the market has
    * @param borrows The total amount of borrows the market has outstanding
    * @param reserves The total amount of reserves the market has
    * @param reserveFactorMantissa The current reserve factor the market has
    * @param blockTime The number of seconds per block
    * @return The supply rate per block (as a percentage, and scaled by 1e18)
    */
  public async getSupplyRateAPY(cash: BigInt, borrows: BigInt, reserves: BigInt, reserveFactorMantissa: BigInt, blockTime: number): Promise<BigInt> {
    const rate = await this.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa);
    return this.blockToYear(rate, blockTime);
  }

  /**
    * Convert rate per block to rate APY 
    *@param rate The rate per block
    *@param blockTime The number of seconds per block
    */
  private blockToYear(rate: BigInt, blockTime: number): BigInt {
    const daysPerYear = 365;
    const blocksPerDay = daysPerYear * 24 * 3600 / blockTime;
    const r = Number(rate) / this.decimals;
    const APY = (Math.pow((r * blocksPerDay) + 1, daysPerYear - 1)) - 1;
    return BigInt(APY * this.decimals);
  }
}