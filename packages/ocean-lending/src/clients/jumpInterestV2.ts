import { OToken } from './oToken';
import { Client } from './client';

/**
 * JumpInterest V2 contract client.
 */
class JumpInterestV2 extends Client {
  private readonly decimals = 1e18;

  /*
   * The approximate number of blocks per year.
   */
  public async blocksPerYear(): Promise<BigInt> {
    const blocks = await this.contract.methods.blocksPerYear().call();
    return BigInt(blocks);
  }

  /*
   * The multiplier of utilization rate that gives the slope of the interest rate.
   */
  public async multiplierPerBlock(): Promise<BigInt> {
    const m = await this.contract.methods.multiplierPerBlock().call();
    return BigInt(m);
  }

  /**
 * Convert multiplierPerBlock into multiplierPerYear
 */
    public async multiplierPerYear(): Promise<BigInt> {
    const [multiplierPerBlock, blocksPerYear, kink] = await Promise.all([this.multiplierPerBlock(),  this.blocksPerYear(), this.kink()]);
    const multiplierPerYear = multiplierPerBlock.valueOf() * blocksPerYear.valueOf() * kink.valueOf() / this.decimals;
    return multiplierPerYear;
  }

  /**
   * The base interest rate which is the y-intercept when utilization rate is 0
   */
  public async baseRatePerBlock(): Promise<BigInt> {
    const b = await this.contract.methods.baseRatePerBlock().call();
    return BigInt(b);
  }

  /**
   * Convert baseRatePerBlock into baseRatePerYear
   */
  public async baseRatePerYear(): Promise<BigInt> {
    const b = await this.contract.methods.baseRatePerBlock().call();
    return this.blockToYear(BigInt(b));
  }

  /**
   * The multiplierPerBlock after hitting a specified utilization point
   */
  public async jumpMultiplierPerBlock(): Promise<BigInt> {
    const j = await this.contract.methods.jumpMultiplierPerBlock().call();
    return BigInt(j);
  }

  /**
   * Convert jumpMultiplierPerBlock into jumpMultiplierPerYear
   *
   */
  public async jumpMultiplierPerYear(): Promise<BigInt> {
    const b = await this.contract.methods.jumpMultiplierPerBlock().call();
    return this.blockToYear(BigInt(b));
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
  public async getBorrowRateByOToken(oToken: OToken): Promise<BigInt> {
    const [cash, borrows, reserves] = await Promise.all([
      oToken.getCash(),
      oToken.totalBorrowsCurrent(),
      oToken.totalReserves()
    ]);
    const rate = await this.contract.methods.getBorrowRate(cash, borrows, reserves).call();
    return BigInt(rate);
  }

  /**
   * Calculates the current borrow interest rate per block
   * @param oToken The ocean-lending client object
   * @return The borrow rate per block (as a percentage, and scaled by 1e18)
   */
  public async getBorrowRate(cash: BigInt, borrows: BigInt, reserves: BigInt): Promise<BigInt> {
    const rate = await this.contract.methods.getBorrowRate(cash, borrows, reserves).call();
    return BigInt(rate);
  }

  /**
   * Calculates the current supply interest rate per block
   * @param oToken The ocean-lending client object
   * @return The supply rate per block (as a percentage, and scaled by 1e18)
   */
  public async getSupplyRateByOToken(oToken: OToken): Promise<BigInt> {
    const [cash, borrows, reserves, reserveFactorMantissa] = await Promise.all([
      oToken.getCash(),
      oToken.totalBorrowsCurrent(),
      oToken.totalReserves(),
      oToken.reserveFactorMantissa()
    ]);
    const rate = await this.contract.methods.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa).call();
    return BigInt(rate);
  }

  public async getSupplyRate(
    cash: BigInt,
    borrows: BigInt,
    reserves: BigInt,
    reserveFactorMantissa: BigInt
  ): Promise<BigInt> {
    const rate = await this.contract.methods.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa).call();
    return BigInt(rate);
  }

  /**
   * Calculates the current borrow interest rate APY
   * @param oToken The ocean-lending client object
   * @return The borrow rate per block (as a percentage, and scaled by 1e18)
   */
  public async getBorrowRateAPY(oToken: OToken): Promise<BigInt> {
    const rate = await this.getBorrowRateByOToken(oToken);
    return this.blockToYear(rate);
  }

  /**
   * Calculates the current supply interest rate APY
   * @param oToken The ocean-lending client object
   * @return The supply rate per block (as a percentage, and scaled by 1e18)
   */
  public async getSupplyRateAPY(oToken: OToken): Promise<BigInt> {
    const rate = await this.getSupplyRateByOToken(oToken);
    return this.blockToYear(rate);
  }

  /**
   * Convert rate per block to rate APY
   *@param ratePerBlock The rate per block
   */
  public async blockToYear(ratePerBlock: BigInt): Promise<BigInt> {
    const blocksPerYear = await this.blocksPerYear();
    const APY = blocksPerYear.valueOf() * ratePerBlock.valueOf();
    return APY;
  }
}

export default JumpInterestV2;
export { JumpInterestV2 };
