import 'jest';
import { DEFAULT_PARAM, InterestConfig } from '../src/config';
import { OceanDecoder, OceanEncoder } from '../src/encoding';
import { Address, Uint16 } from '../src/types';

describe('Encoding', () => {
  it('works', () => {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint16(1),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
      }
    };
    const t2 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a4'),
      subscriptionId: new Uint16(1),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4005) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001)
      }
    };
    const poolConfig = {
      closeFactor: new Uint16(5000),
      liquidationIncentive: new Uint16(1080),
      tokens: [t1, t2]
    };
    const buf = OceanEncoder.encode(poolConfig);
    console.log('works:', buf.toString('hex'));

    const decodeed = OceanDecoder.decode(buf);
    expect(poolConfig).toEqual(decodeed);
  });

  it('with default', () => {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint16(1),
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
      subscriptionId: new Uint16(2),
      interest: new InterestConfig(
        undefined, // baseRatePerYear
        undefined, // multiplierPerYear
        undefined, // jumpMultiplierPerYear
        undefined // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: undefined,
      }
    };
    const poolConfig = {
      closeFactor: undefined,
      liquidationIncentive: undefined,
      tokens: [t1, t2]
    };
    const buf = OceanEncoder.encode(poolConfig);
    console.log('default:', buf.toString('hex'));

    const expected = {
      closeFactor: DEFAULT_PARAM.closeFactor,
      liquidationIncentive: DEFAULT_PARAM.liquidationIncentive,
      tokens: [
        {
          underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
          subscriptionId: new Uint16(1),
          interest: new InterestConfig(
            DEFAULT_PARAM.baseRatePerYear, // baseRatePerYear
            DEFAULT_PARAM.multiplierPerYear, // multiplierPerYear
            DEFAULT_PARAM.jumpMultiplierPerYear, // jumpMultiplierPerYear
            DEFAULT_PARAM.kink // kink
          ),
          collateral: {
            canBeCollateral: true,
            collateralFactor: DEFAULT_PARAM.collateralFactor,
          }
        },
        {
          underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a4'),
          subscriptionId: new Uint16(2),
          interest: new InterestConfig(
            DEFAULT_PARAM.baseRatePerYear, // baseRatePerYear
            DEFAULT_PARAM.multiplierPerYear, // multiplierPerYear
            DEFAULT_PARAM.jumpMultiplierPerYear, // jumpMultiplierPerYear
            DEFAULT_PARAM.kink // kink
          ),
          collateral: {
            canBeCollateral: false,
            collateralFactor: new Uint16(0),
          }
        }
      ]
    };
    const decodeed = OceanDecoder.decode(buf);
    console.log(decodeed);
    expect(expected).toEqual(decodeed);
  });
});
