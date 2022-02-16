import { Address, Uint16, Uint64 } from "./types";

export interface InterestConfig {
    baseRatePerYear: Uint16 | undefined,
    multiplierPerYear: Uint16 | undefined,
    jumpMultiplierPerYear: Uint16 | undefined,
    kink: Uint16 | undefined,
}

export interface CollateralConfig {
    canBeCollater: Boolean,
    collateralFactor: Uint16 | undefined
    liquidationIncentive: Uint16 | undefined
}

export interface TokenConfig {
    underlying: Address, // TODO: make this 20 bytes
    subscriptionId: Uint64,
    interest: InterestConfig,
    collateral: CollateralConfig,
}

export interface PoolConfig {
    tokens: TokenConfig[]
}