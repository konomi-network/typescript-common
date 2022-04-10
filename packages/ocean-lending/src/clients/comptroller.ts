import { Client } from './client';
import { PriceOracleAdaptor } from './priceOracle';
import { TxnOptions } from 'options';
import OToken from './oToken';

export interface OceanMarketSummary {
  totalLiquidity: BigInt;
  maxSupplyAPY: number;
  minBorrowAPY: number;
  markets: OTokenMarketSummary[];
}

export interface OTokenMarketSummary {
  address: string;
  decimals: number;
  underlying: string;
  underlyingDecimals: number;
  totalSupply: BigInt;
  totalLiquidity: BigInt;
}

class Comptroller extends Client {
  private readonly DEFAULT_MANTISSA = 1e18;

  public async oracleAddress(): Promise<string> {
    return this.contract.methods.oracle().call();
  }

  public async enterMarkets(markets: string[], options: TxnOptions): Promise<void> {
    const method = this.contract.methods.enterMarkets(markets);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async getAccountLiquidity(address: string): Promise<number> {
    const { 1: liquidity } = await this.contract.methods.getAccountLiquidity(address).call();
    return liquidity / this.DEFAULT_MANTISSA;
  }

  public async getOceanMarketSummary(
    blockTime: number,
    priceOracleAdaptor: PriceOracleAdaptor
  ): Promise<OceanMarketSummary> {
    const markets = await this.allMarkets();
    const promises: Promise<any>[] = [this.maxSupplyAPY(blockTime, markets), this.minBorrowAPY(blockTime, markets)];

    markets.forEach((m) => {
      promises.push(this.getOTokenMarketSummary(m, priceOracleAdaptor));
    });

    const values = await Promise.all(promises);

    const otokens: OTokenMarketSummary[] = values.slice(2);
    let totalLiquidity = BigInt(0);
    otokens.forEach((o) => (totalLiquidity += o.totalLiquidity.valueOf()));

    return {
      totalLiquidity,
      maxSupplyAPY: values[0],
      minBorrowAPY: values[1],
      markets: otokens
    };
  }

  public async getOTokenMarketSummary(
    market: string,
    priceOracleAdaptor: PriceOracleAdaptor
  ): Promise<OTokenMarketSummary> {
    const items = await Promise.all([
      this.callMethod<BigInt>(market, 'totalSupply()'),
      this.callMethod<BigInt>(market, 'exchangeRateCurrent()'),
      this.callMethod<string>(market, 'underlying()', ['address']),
      priceOracleAdaptor.getUnderlyingPrice(market)
    ]);

    const underlyingDecimals = Number(await this.callMethod<number>(items[2], 'decimals()'));

    const mantissa = 18 + underlyingDecimals - OToken.OTOKEN_DECIMALS;
    const num = items[0].valueOf() * items[1].valueOf();
    const totalUnderlying = BigInt(num) / BigInt(Math.pow(10, mantissa));
    const totalLiquidity = (totalUnderlying * BigInt(Number(items[3]) * 1e8)) / BigInt(1e8);

    return {
      address: market,
      decimals: OToken.OTOKEN_DECIMALS,
      underlying: items[2],
      underlyingDecimals,
      totalSupply: items[0],
      totalLiquidity: totalLiquidity.valueOf() / BigInt(1e8)
    };
  }

  /*
   * The additional collateral given to liquidators as an incentive to perform liquidation of underwater accounts.
   * For example, if the liquidation incentive is 1.1, liquidators receive an extra 10% of the borrowers collateral for every unit they close.
   */
  public async liquidationIncentive(): Promise<number> {
    const incentive = await this.contract.methods.liquidationIncentiveMantissa().call();
    return (incentive / this.DEFAULT_MANTISSA) * 100;
  }

  /**
   * A cToken's collateral factor can range from 0-90%
   * represents the proportionate increase in liquidity that an account receives by minting the cToken
   */
  public async collateralFactor(address: string): Promise<number> {
    const { 1: factor } = await this.contract.methods.markets(address).call();
    return (factor / this.DEFAULT_MANTISSA) * 100;
  }

  public async closeFactor(): Promise<number> {
    const factor = await this.contract.methods.closeFactorMantissa().call();
    return (factor / this.DEFAULT_MANTISSA) * 100;
  }

  public async allMarkets(): Promise<string[]> {
    return this.contract.methods.getAllMarkets().call();
  }

  public async totalSupply(tokenAddress: string): Promise<BigInt> {
    const supply = await this.callMethod<BigInt>(tokenAddress, 'totalSupply()');
    return supply;
  }

  public async getCash(tokenAddress: string): Promise<BigInt> {
    return this.callMethod<BigInt>(tokenAddress, 'getCash()');
  }

  private async callMethod<T>(tokenAddress: string, methodName: string, types?: string[]): Promise<T> {
    const method = this.web3.utils.keccak256(methodName).substr(0, 10);
    const transaction = {
      to: tokenAddress,
      data: method
    };

    if (types === undefined) {
      types = ['uint256'];
    }

    try {
      const raw = await this.web3.eth.call(transaction);
      const r = this.web3.eth.abi.decodeParameters(types, raw);
      return r[0];
    } catch (e) {
      console.log(types);
      throw e;
    }
  }

  public async minBorrowAPY(blockTime: number, tokenAddresses: string[]): Promise<number> {
    let min: number = 100;
    for (const tokenAddress of tokenAddresses) {
      const rateRaw: BigInt = await this.callMethod(tokenAddress, 'borrowRatePerBlock()');
      const rate = Number(rateRaw) / OToken.UNDERLYING_MANTISSA;
      const borrowRateAPY = await OToken.ratePerBlockToAPY(rate, blockTime);

      if (min > borrowRateAPY) {
        min = borrowRateAPY;
      }
    }
    return min;
  }

  public async maxSupplyAPY(blockTime: number, tokenAddresses: string[]): Promise<number> {
    let max: number = -1;
    for (const tokenAddress of tokenAddresses) {
      const rateRaw: BigInt = await this.callMethod(tokenAddress, 'supplyRatePerBlock()');
      const rate = Number(rateRaw) / OToken.UNDERLYING_MANTISSA;
      const supplyRateAPY = await OToken.ratePerBlockToAPY(rate, blockTime);

      if (max < supplyRateAPY) {
        max = supplyRateAPY;
      }
    }

    return max;
  }
}

export default Comptroller;
export { Comptroller };
