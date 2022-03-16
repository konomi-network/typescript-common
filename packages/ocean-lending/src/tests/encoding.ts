import 'jest';
import { DEFAULT_PARAM, InterestConfig } from '../config';
import { OceanDecoder, OceanEncoder } from '../encoding';
import { Address, Uint16, Uint64 } from '../types';

describe('Encoding', () => {
  it('works', () => {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const t2 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a4'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4005) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const poolConfig = {
      tokens: [t1, t2]
    };
    const buf = OceanEncoder.encode(poolConfig);
    console.log(buf.toString('hex'));

    const decodeed = OceanDecoder.decode(buf);
    expect(poolConfig).toEqual(decodeed);
  });

  it('with default', () => {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        undefined, // baseRatePerYear
        undefined, // multiplierPerYear
        undefined, // jumpMultiplierPerYear
        undefined // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: undefined,
        liquidationIncentive: undefined
      }
    };
    const t2 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a4'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        undefined, // baseRatePerYear
        undefined, // multiplierPerYear
        undefined, // jumpMultiplierPerYear
        undefined // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: undefined,
        liquidationIncentive: undefined
      }
    };
    const poolConfig = {
      tokens: [t1, t2]
    };
    const buf = OceanEncoder.encode(poolConfig);

    const expected = {
      tokens: [
        {
          underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
          subscriptionId: new Uint64(BigInt(1)),
          interest: new InterestConfig(
            DEFAULT_PARAM.baseRatePerYear, // baseRatePerYear
            DEFAULT_PARAM.multiplierPerYear, // multiplierPerYear
            DEFAULT_PARAM.jumpMultiplierPerYear, // jumpMultiplierPerYear
            DEFAULT_PARAM.kink // kink
          ),
          collateral: {
            canBeCollateral: true,
            collateralFactor: DEFAULT_PARAM.collateralFactor,
            liquidationIncentive: DEFAULT_PARAM.liquidationIncentive
          }
        },
        {
          underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a4'),
          subscriptionId: new Uint64(BigInt(1)),
          interest: new InterestConfig(
            DEFAULT_PARAM.baseRatePerYear, // baseRatePerYear
            DEFAULT_PARAM.multiplierPerYear, // multiplierPerYear
            DEFAULT_PARAM.jumpMultiplierPerYear, // jumpMultiplierPerYear
            DEFAULT_PARAM.kink // kink
          ),
          collateral: {
            canBeCollateral: false,
            collateralFactor: new Uint16(0),
            liquidationIncentive: DEFAULT_PARAM.liquidationIncentive
          }
        }
      ]
    };
    const decodeed = OceanDecoder.decode(buf);
    expect(expected).toEqual(decodeed);
  });
});

describe('Encoding Single', () => {
  it('works', () => {
    const token = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const buf = OceanEncoder.encodeSingle(token);

    const decodeed = OceanDecoder.decodeSingle(buf, 0)[0];
    expect(token).toEqual(decodeed);
  });

  it('works - but not as collateral', () => {
    const token = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const buf = OceanEncoder.encodeSingle(token);

    const expected = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(0),
        liquidationIncentive: new Uint16(2)
      }
    };
    const decodeed = OceanDecoder.decodeSingle(buf, 0)[0];
    expect(expected).toEqual(decodeed);
  });

  it('works - can be collateral with default', () => {
    const token = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: undefined,
        liquidationIncentive: new Uint16(2)
      }
    };
    const buf = OceanEncoder.encodeSingle(token);

    const expected = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: DEFAULT_PARAM.collateralFactor,
        liquidationIncentive: new Uint16(2)
      }
    };
    const decodeed = OceanDecoder.decodeSingle(buf, 0)[0];
    expect(expected).toEqual(decodeed);
  });

  it('with default', () => {
    const token = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        undefined, // baseRatePerYear
        undefined, // multiplierPerYear
        undefined, // jumpMultiplierPerYear
        undefined // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: undefined,
        liquidationIncentive: undefined
      }
    };
    const buf = OceanEncoder.encodeSingle(token);

    const expected = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        DEFAULT_PARAM.baseRatePerYear, // baseRatePerYear
        DEFAULT_PARAM.multiplierPerYear, // multiplierPerYear
        DEFAULT_PARAM.jumpMultiplierPerYear, // jumpMultiplierPerYear
        DEFAULT_PARAM.kink // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(0),
        liquidationIncentive: DEFAULT_PARAM.liquidationIncentive
      }
    };
    const decodeed = OceanDecoder.decodeSingle(buf, 0)[0];
    expect(expected).toEqual(decodeed);
  });
});
