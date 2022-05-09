import { Client, TxnCallbacks } from './client';
import { PriceOracleAdaptor } from './priceOracle';
import { TxnOptions } from 'options';
import OToken from './oToken';
import Web3 from 'web3';

export interface AccountOceanSummary {
  totalSupplyUSD: number;
  totalBorrowUSD: number;
  borrowLimit: number;
  // markets: { address: string; totalSupply: number; totalBorrow: number }[];
}

export interface OceanMarketSummary {
  totalSupplyUSD: number;
  maxSupplyAPY: number;
  minBorrowAPY: number;
  liquidationIncentive: number;
  closeFactor: number;
  markets: OTokenMarketSummary[];
}

export interface OTokenMarketSummary {
  address: string;
  exchangeRate: number;
  decimals: number;
  underlying: string;
  underlyingDecimals: number;
  totalSupply: number;
  totalBorrow: number;
  totalSupplyUSD: number;
  totalBorrowUSD: number;
  borrowAPY: Number;
  supplyAPY: Number;
  price: number;
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

  public async getAccountLiquidity(account: string): Promise<[number, number]> {
    const { 1: liquidity, 2: shortfall } = await this.contract.methods.getAccountLiquidity(account).call();
    return [Number(Web3.utils.fromWei(liquidity)), Number(Web3.utils.fromWei(shortfall))];
  }

  public async getAccountLiquidityInfo(account: string): Promise<AccountLiquidityInfo> {
    const {
      '0': error,
      '1': liquidity,
      '2': shortfall
    } = await this.contract.methods.getAccountLiquidity(account).call();
    return {
      success: error == '0',
      liquidity: Number(liquidity) / this.DEFAULT_MANTISSA,
      shortfall: Number(shortfall) / this.DEFAULT_MANTISSA
    };
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
      shortfall: Number(shortfall) / this.DEFAULT_MANTISSA
    };
  }

  public async getOceanMasterRewards(
    markets: {
      address: string;
      underlyingDecimals: number;
    }[]
  ): Promise<Map<string, number>> {
    const rewards = await Promise.all(
      markets.map((m) =>
        this.callMethodSingleReturn<number>(
          m.address,
          'oceanFeeSetup()',
          ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
          4
        )
      )
    );
    const oceanRewards = new Map();
    for (let i = 0; i < markets.length; i++) {
      oceanRewards.set(markets[i].address, rewards[i] / Math.pow(10, markets[i].underlyingDecimals));
    }
    return oceanRewards;
  }

  public async getAccountSummary(
    account: string,
    oceanMarketSummary: OceanMarketSummary
  ): Promise<AccountOceanSummary> {
    const values: number[][] = await Promise.all(
      oceanMarketSummary.markets.map((m) => OToken.accountPosition(this.web3, m.address, account))
    );

    let totalSupplyUSD = 0;
    let totalBorrowUSD = 0;
    for (let i = 0; i < values.length; i++) {
      const [oTokenSupplied, underlyingBorrowed] = values[i];
      const supply = Comptroller.oTokenToHumanReadable(
        oTokenSupplied,
        oceanMarketSummary.markets[i].exchangeRate,
        oceanMarketSummary.markets[i].underlyingDecimals
      );
      const borrow = Comptroller.underlyingToHumanReadable(underlyingBorrowed);
      totalSupplyUSD += oceanMarketSummary.markets[i].price * supply;
      totalBorrowUSD += oceanMarketSummary.markets[i].price * borrow;
    }

    const liquidityInfo = await this.getAccountLiquidity(account);
    return {
      totalSupplyUSD,
      totalBorrowUSD,
      borrowLimit: totalBorrowUSD + liquidityInfo[0] > 0 ? liquidityInfo[0] : -1 * liquidityInfo[1]
    };
  }

  public async getOceanMarketSummary(
    blockTime: number,
    priceOracleAdaptor: PriceOracleAdaptor
  ): Promise<OceanMarketSummary> {
    const markets = await this.allMarkets();
    const promises: Promise<any>[] = [this.liquidationIncentive(), this.closeFactor()];

    markets.forEach((m) => {
      promises.push(this.getOTokenMarketSummary(m, priceOracleAdaptor, blockTime));
    });

    const values = await Promise.all(promises);

    const oTokens: OTokenMarketSummary[] = values.slice(2);
    let totalSupplyUSD = 0;
    let maxSupplyAPY = 0;
    let minBorrowAPY = Number.MAX_SAFE_INTEGER;
    oTokens.forEach((o) => {
      totalSupplyUSD += o.totalSupplyUSD;
      maxSupplyAPY = Math.max(maxSupplyAPY, Number(o.supplyAPY));
      minBorrowAPY = Math.min(minBorrowAPY, Number(o.borrowAPY));
    });

    return {
      totalSupplyUSD,
      liquidationIncentive: values[0],
      closeFactor: values[1],
      maxSupplyAPY,
      minBorrowAPY,
      markets: oTokens
    };
  }

  public async getOTokenMarketSummary(
    market: string,
    priceOracleAdaptor: PriceOracleAdaptor,
    blockTime: number
  ): Promise<OTokenMarketSummary> {
    const items = await Promise.all([
      this.callMethodSingleReturn<BigInt>(market, 'totalSupply()'),
      this.callMethodSingleReturn<BigInt>(market, 'totalBorrows()'),
      this.callMethodSingleReturn<BigInt>(market, 'exchangeRateCurrent()'),
      this.callMethodSingleReturn<string>(market, 'underlying()', ['address']),
      priceOracleAdaptor.getUnderlyingPrice(market),
      this.callMethodSingleReturn<string>(market, 'borrowRatePerBlock()'),
      this.callMethodSingleReturn<string>(market, 'supplyRatePerBlock()')
    ]);

    const underlyingDecimals = Number(await this.callMethodSingleReturn<number>(items[3], 'decimals()'));

    const exchangeRate = Number(items[2]);
    const mantissa = 18 + underlyingDecimals; // no need minus OToken.OTOKEN_DECIMALS as converting to human readable
    const totalSupply = (Number(items[0]) * exchangeRate) / Math.pow(10, mantissa);
    const totalBorrow = Number(items[1]) / Math.pow(10, underlyingDecimals);
    const price = Number(items[4]);

    const borrowAPY = await OToken.ratePerBlockToAPY(Number(items[5]) / OToken.UNDERLYING_MANTISSA, blockTime);
    const supplyAPY = await OToken.ratePerBlockToAPY(Number(items[6]) / OToken.UNDERLYING_MANTISSA, blockTime);

    return {
      address: market,
      exchangeRate: Number(items[2]),
      decimals: OToken.OTOKEN_DECIMALS,
      underlying: items[3],
      underlyingDecimals,
      totalSupply,
      totalBorrow,
      totalSupplyUSD: totalSupply * price,
      totalBorrowUSD: totalBorrow * price,
      borrowAPY,
      supplyAPY,
      price
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
    const supply = await this.callMethodSingleReturn<BigInt>(tokenAddress, 'totalSupply()');
    return supply;
  }

  public async getCash(tokenAddress: string): Promise<BigInt> {
    return this.callMethodSingleReturn<BigInt>(tokenAddress, 'getCash()');
  }

  private static oTokenToHumanReadable(amount: number, exchangeRate: number, underlyingDecimals: number): number {
    // no need minus OToken.OTOKEN_DECIMALS as converting to human readable
    const mantissa = 18 + underlyingDecimals;
    return (amount * exchangeRate) / Math.pow(10, mantissa);
  }

  private static underlyingToHumanReadable(amount: number): number {
    return Number(Web3.utils.fromWei(amount.toString()));
  }

  private async callMethodSingleReturn<T>(
    tokenAddress: string,
    methodName: string,
    types?: string[],
    index?: number
  ): Promise<T> {
    const method = this.web3.utils.keccak256(methodName).substr(0, 10);
    const transaction = {
      to: tokenAddress,
      data: method
    };

    if (types === undefined) {
      types = ['uint256'];
    }
    if (index === undefined) {
      index = 0;
    }

    try {
      const raw = await this.web3.eth.call(transaction);
      const r = this.web3.eth.abi.decodeParameters(types, raw);
      return r[index];
    } catch (e) {
      console.log(types);
      throw e;
    }
  }
}

export default Comptroller;
export { Comptroller };
