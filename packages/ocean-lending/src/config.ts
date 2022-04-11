import { Address, Uint16 } from './types';

export const DEFAULT_PARAM = {
  baseRatePerYear: new Uint16(1),
  multiplierPerYear: new Uint16(1),
  jumpMultiplierPerYear: new Uint16(1),
  kink: new Uint16(1),
  collateralFactor: new Uint16(1),
  liquidationIncentive: new Uint16(1006),
  closeFactor: new Uint16(5000)
};

export class InterestConfig {
  private inner: [string, Uint16 | undefined][];

  constructor(
    baseRatePerYear: Uint16 | undefined,
    multiplierPerYear: Uint16 | undefined,
    jumpMultiplierPerYear: Uint16 | undefined,
    kink: Uint16 | undefined
  ) {
    this.inner = [
      ['baseRatePerYear', baseRatePerYear],
      ['multiplierPerYear', multiplierPerYear],
      ['jumpMultiplierPerYear', jumpMultiplierPerYear],
      ['kink', kink]
    ];
  }

  public dump(): [string, Uint16 | undefined][] {
    return this.inner;
  }

  public values(): (Uint16 | undefined)[] {
    return this.inner.map((v) => v[1]);
  }

  public keys(): string[] {
    return this.inner.map((v) => v[0]);
  }
}

export interface CollateralConfig {
  canBeCollateral: boolean;
  collateralFactor: Uint16 | undefined;
}

export interface TokenConfig {
  underlying: Address;
  subscriptionId: Uint16;
  interest: InterestConfig;
  collateral: CollateralConfig;
}

export interface PoolConfig {
  liquidationIncentive: Uint16 | undefined;
  closeFactor: Uint16 | undefined;
  tokens: TokenConfig[];
}

export interface Header {
  baseRatePerYear: boolean;
  multiplierPerYear: boolean;
  jumpMultiplierPerYear: boolean;
  kink: boolean;
  collateralFactor: boolean;
  canBeCollateral: boolean;
}

export interface PoolData {
  owner: string;
  leaseStart: BigInt;
  leaseEnd: BigInt;
  deployContract: string;
  suspended: boolean;
}
