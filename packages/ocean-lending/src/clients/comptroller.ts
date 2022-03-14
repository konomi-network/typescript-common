import { Client } from './client';
import { PriceOracle } from './priceOracle';
import { JumpInterestV2 } from './jumpInterestV2';
import { TxnOptions } from 'options';

class Comptroller extends Client {
  private readonly decimals = 1e18;

  public async enterMarkets(markets: string[], options: TxnOptions): Promise<void> {
    const method = this.contract.methods.enterMarkets(markets);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async getAccountLiquidity(address: string): Promise<number> {
    const { 1: liquidity } = await this.contract.methods.getAccountLiquidity(address).call();
    return liquidity / this.decimals;
  }

  public async markets(address: string): Promise<number> {
    const { 1: collateralFactor } = await this.contract.methods.markets(address).call();
    return (collateralFactor / this.decimals) * 100;
  }

  /*
   * The additional collateral given to liquidators as an incentive to perform liquidation of underwater accounts.
   * For example, if the liquidation incentive is 1.1, liquidators receive an extra 10% of the borrowers collateral for every unit they close.
   */
  public async liquidationIncentive(): Promise<BigInt> {
    const incentive = await this.contract.methods.liquidationIncentiveMantissa().call();
    return BigInt(incentive);
  }

  /**
   * A cToken's collateral factor can range from 0-90%
   * represents the proportionate increase in liquidity that an account receives by minting the cToken
   */
  public async collateralFactor(address: string): Promise<number> {
    const { 1: factor } = await this.contract.methods.markets(address).call();
    return (factor / this.decimals) * 100;
  }

  public async closeFactor(): Promise<number> {
    const factor = await this.contract.methods.closeFactorMantissa().call();
    return (factor / this.decimals) * 100;
  }

  public async allMarkets(): Promise<string[]> {
    return this.contract.methods.getAllMarkets().call();
  }

  public async totalSupply(tokenAddress: string): Promise<number> {
    return Number(await this.callMethod(tokenAddress, 'totalSupply()'));
  }

  public async getCash(tokenAddress: string): Promise<BigInt> {
    return this.callMethod(tokenAddress, 'getCash()');
  }

  public async totalBorrowsCurrent(tokenAddress: string): Promise<BigInt> {
    return this.callMethod(tokenAddress, 'totalBorrowsCurrent()');
  }

  public async totalReserves(tokenAddress: string): Promise<BigInt> {
    return this.callMethod(tokenAddress, 'totalReserves()');
  }

  public async reserveFactorMantissa(tokenAddress: string): Promise<BigInt> {
    return this.callMethod(tokenAddress, 'reserveFactorMantissa()');
  }

  private async callMethod(tokenAddress: string, methodName: string): Promise<BigInt> {
    const method = this.web3.utils.keccak256(methodName).substr(0, 10);
    const transaction = {
      to: tokenAddress,
      data: method
    };

    const r = this.web3.eth.abi.decodeParameters(['uint256'], await this.web3.eth.call(transaction));
    return r[0];
  }

  public async totalLiquidity(priceOracle: PriceOracle) {
    const tokenAddresses = await this.allMarkets();
    let totalValue = 0;
    for (const tokenAddress of tokenAddresses) {
      const supply = await this.totalSupply(tokenAddress);
      const price = await priceOracle.getUnderlyingPrice(tokenAddress);
      totalValue += supply * price;
    }
    return totalValue;
  }

  public async minBorrowAPY(jumpInterestV2: JumpInterestV2, blockTime: number) {
    const tokenAddresses = await this.allMarkets();
    let min: BigInt = BigInt(-1);
    for (const tokenAddress of tokenAddresses) {
      const cash = await this.getCash(tokenAddress);
      const borrows = await this.totalBorrowsCurrent(tokenAddress);
      const totalReserves = await this.totalReserves(tokenAddress);

      const rate = await jumpInterestV2.getBorrowRate(cash, borrows, totalReserves);

      const borrowRateAPY = jumpInterestV2.blockToYear(rate, blockTime);

      if (min == BigInt(-1) || min > borrowRateAPY) {
        min = borrowRateAPY;
      }
    }
    return min;
  }

  public async maxSupplyAPY(jumpInterestV2: JumpInterestV2, blockTime: number) {
    const tokenAddresses = await this.allMarkets();
    let max: BigInt = BigInt(-1);
    for (const tokenAddress of tokenAddresses) {
      const cash = await this.getCash(tokenAddress);
      const borrows = await this.totalBorrowsCurrent(tokenAddress);
      const totalReserves = await this.totalReserves(tokenAddress);
      const reserveFactorMantissa = await this.reserveFactorMantissa(tokenAddress);

      const rate = await jumpInterestV2.getSupplyRate(cash, borrows, totalReserves, reserveFactorMantissa);

      const supplyRateAPY = jumpInterestV2.blockToYear(rate, blockTime);

      if (max == BigInt(-1) || max < supplyRateAPY) {
        max = supplyRateAPY;
      }
    }
    return max;
  }
}

export default Comptroller;
export { Comptroller };
