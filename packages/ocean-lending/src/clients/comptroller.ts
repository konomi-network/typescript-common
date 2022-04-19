import { Client, TxnCallbacks } from './client';
import { PriceOracleAdaptor } from './priceOracle';
import { TxnOptions } from 'options';
import OToken from './oToken';

export interface OceanMarketSummary {
  accountLiquidity: number;
  totalLiquidity: number;
  maxSupplyAPY: number;
  minBorrowAPY: number;
  liquidationIncentive: number;
  closeFactor: number;
  markets: OTokenMarketSummary[];
}

export interface OTokenMarketSummary {
  address: string;
  decimals: number;
  underlying: string;
  underlyingDecimals: number;
  totalSupply: number;
  totalBorrow: number;
  totalLiquidity: number;
}

export interface AccountLiquidityInfo {
  success: boolean;
  liquidity: number;
  shortfall: number;
}

class Comptroller extends Client {
  private readonly DEFAULT_MANTISSA = 1e18;

  public async oracleAddress(): Promise<string> {
    return this.contract.methods.oracle().call();
  }

  public async enterMarkets(markets: string[], options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.enterMarkets(markets);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  /**
   * Returns whether the given account is entered in the given asset
   * @param account The address of the account to check
   * @param tokenAddress The cToken to check
   * @return True if the account is in the asset, otherwise false.
   */
  public async checkMembership(account: string, tokenAddress: string): Promise<boolean> {
    return this.contract.methods.checkMembership(account, tokenAddress).call();
  }

  /**
   * @notice Returns the assets an account has entered
   * @param account The address of the account to pull assets for
   * @return A dynamic list with the assets the account has entered
   */
  public async getAssetsIn(account: string): Promise<string[]> {
    return this.contract.methods.getAssetsIn(account).call();
  }

  /**
   * Removes asset from sender's account liquidity calculation
   * Sender must not have an outstanding borrow balance in the asset,
   *  or be providing necessary collateral for an outstanding borrow.
   * @param tokenAddress The address of the asset to be removed
   */
  public async exitMarket(tokenAddress: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.exitMarket(tokenAddress);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async getAccountLiquidity(account: string): Promise<number> {
    const { 1: liquidity } = await this.contract.methods.getAccountLiquidity(account).call();
    return liquidity / this.DEFAULT_MANTISSA;
  }

  /**
   * Determine what the account liquidity would be if the given amounts were redeemed/borrowed
   * @param account The account to determine liquidity for
   * @param cTokenModify The market to hypothetically redeem/borrow in
   * @param redeemTokens The number of tokens to hypothetically redeem
   * @param borrowAmount The amount of underlying to hypothetically borrow
   * @return Tuple of values (error, liquidity, shortfall).
   * The error shall be 0 on success, otherwise an error code.
   * A non-zero liquidity value indicates the account has available account liquidity.
   * A non-zero shortfall value indicates the account is currently below his/her collateral requirement and is subject to liquidation.
   * At most one of liquidity or shortfall shall be non-zero.
   */
  public async getHypotheticalAccountLiquidity(
    account: string,
    cTokenModify: string,
    redeemTokens: number,
    borrowAmount: number
  ): Promise<AccountLiquidityInfo> {
    const {
      '0': error,
      '1': liquidity,
      '2': shortfall
    } = await this.contract.methods
      .getHypotheticalAccountLiquidity(account, cTokenModify, redeemTokens, borrowAmount)
      .call();
    return {
      success: error == '0',
      liquidity: Number(liquidity) / this.DEFAULT_MANTISSA,
      shortfall: Number(shortfall)
    };
  }

  public async getOceanMarketSummary(
    blockTime: number,
    priceOracleAdaptor: PriceOracleAdaptor,
    account: string
  ): Promise<OceanMarketSummary> {
    const markets = await this.allMarkets();
    const promises: Promise<any>[] = [
      this.liquidationIncentive(),
      this.closeFactor(),
      this.maxSupplyAPY(blockTime, markets),
      this.minBorrowAPY(blockTime, markets),
      this.getAccountLiquidity(account)
    ];

    markets.forEach((m) => {
      promises.push(this.getOTokenMarketSummary(m, priceOracleAdaptor));
    });

    const values = await Promise.all(promises);

    const oTokens: OTokenMarketSummary[] = values.slice(5);
    let totalLiquidity = 0;
    oTokens.forEach((o) => (totalLiquidity += o.totalLiquidity));

    return {
      totalLiquidity,
      liquidationIncentive: values[0],
      closeFactor: values[1],
      maxSupplyAPY: values[2],
      minBorrowAPY: values[3],
      accountLiquidity: values[4],
      markets: oTokens
    };
  }

  public async getOTokenMarketSummary(
    market: string,
    priceOracleAdaptor: PriceOracleAdaptor
  ): Promise<OTokenMarketSummary> {
    const items = await Promise.all([
      this.callMethod<BigInt>(market, 'totalSupply()'),
      this.callMethod<BigInt>(market, 'totalBorrows()'),
      this.callMethod<BigInt>(market, 'exchangeRateCurrent()'),
      this.callMethod<string>(market, 'underlying()', ['address']),
      priceOracleAdaptor.getUnderlyingPrice(market)
    ]);

    const underlyingDecimals = Number(await this.callMethod<number>(items[3], 'decimals()'));

    const mantissa = 18 + underlyingDecimals - OToken.OTOKEN_DECIMALS;
    const num = Number(items[0]) * Number(items[2]);
    const totalUnderlying = num / Math.pow(10, mantissa);
    const totalLiquidity = totalUnderlying * Number(items[4]);

    return {
      address: market,
      decimals: OToken.OTOKEN_DECIMALS,
      underlying: items[3],
      underlyingDecimals,
      totalSupply: Number(items[0]) / 1e10,
      totalBorrow: Number(items[1]) / 1e18,
      totalLiquidity: totalLiquidity / 1e8
    };
  }

  /*
   * The additional collateral given to liquidators as an incentive to perform liquidation of underwater accounts.
   * For example, if the liquidation incentive is 1.1, liquidators receive an extra 10% of the borrowers collateral for every unit they close.
   */
  public async liquidationIncentive(): Promise<number> {
    const incentive = await this.contract.methods.liquidationIncentiveMantissa().call();
    return incentive / this.DEFAULT_MANTISSA;
  }

  /**
   * A cToken's collateral factor can range from 0-90%
   * represents the proportionate increase in liquidity that an account receives by minting the cToken
   */
  public async collateralFactor(tokenAddress: string): Promise<number> {
    const { 1: factor } = await this.contract.methods.markets(tokenAddress).call();
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
