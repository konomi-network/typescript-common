/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CollateralConfig, DEFAULT_PARAM, Header, InterestConfig, PoolConfig, TokenConfig } from './config';
import { Address, Uint16 } from './types';
import { isBitSet } from './utils';

class BitMask {
  readonly mask: number;

  readonly index: number;

  constructor(mask: number, index: number) {
    this.mask = mask;
    this.index = index;
  }
}

// The starting 4 bits are reserved
const CloseFactorIndex = 4;
const LiquidationIncentiveIndex = 5;

/**
 * Only 6 of the 8 bits are used, 2 extra bits are reserved
 */
const DEFAULT_BIT_MASK: Map<string, BitMask> = new Map([
  ['baseRatePerYear', new BitMask(0x1, 0)],
  ['multiplierPerYear', new BitMask(0x2, 1)],
  ['jumpMultiplierPerYear', new BitMask(0x4, 2)],
  ['kink', new BitMask(0x8, 3)],
  ['collateralFactor', new BitMask(0x10, 4)],
  ['canBeCollateral', new BitMask(0x20, 5)]
]);

export class OceanEncoder {
  public static encode(params: PoolConfig): Buffer {
    let buf = OceanEncoder.encodeOceanConfig(params);
    for (const token of params.tokens) {
      buf = Buffer.concat([buf, OceanEncoder.encodeSingle(token)]);
    }
    return buf;
  }

  private static encodeOceanConfig(params: PoolConfig): Buffer {
    const oceanHeader = Buffer.allocUnsafe(1);
    let oceanData = Buffer.allocUnsafe(0);

    let header = 0;

    if (params.closeFactor === undefined) {
      header = header | (1 << CloseFactorIndex);
    } else {
      oceanData = Buffer.concat([oceanData, params.closeFactor.toBuffer()]);
    }

    if (params.liquidationIncentive === undefined) {
      header = header | (1 << LiquidationIncentiveIndex);
    } else {
      oceanData = Buffer.concat([oceanData, params.liquidationIncentive.toBuffer()]);
    }

    oceanHeader.writeUInt8(header);

    let data = Buffer.allocUnsafe(0);
    data = Buffer.concat([data, oceanHeader]);
    data = Buffer.concat([data, oceanData]);

    return data;
  }

  private static encodeSingle(param: TokenConfig): Buffer {
    return Buffer.concat([
      this.encodeHeader(param),
      this.encodeInterest(param.interest),
      param.underlying.toBuffer(),
      param.subscriptionId.toBuffer(),
      this.encodeCollateral(param.collateral)
    ]);
  }

  public static encodeHeader(para: TokenConfig): Buffer {
    let n = 0;

    para.interest.dump().forEach(([k, v]) => {
      if (v === undefined) {
        n = n | (1 << DEFAULT_BIT_MASK.get(k)!.index);
      }
    });

    if (!para.collateral.canBeCollateral) {
      n = n & ~(1 << DEFAULT_BIT_MASK.get('canBeCollateral')!.index);
    } else if (!para.collateral.collateralFactor) {
      n = n | (1 << DEFAULT_BIT_MASK.get('canBeCollateral')!.index);
      n = n | (1 << DEFAULT_BIT_MASK.get('collateralFactor')!.index);
    } else {
      n = n | (1 << DEFAULT_BIT_MASK.get('canBeCollateral')!.index);
    }

    const b = Buffer.allocUnsafe(1);
    b.writeUInt8(n, 0);

    return b;
  }

  public static encodeInterest(param: InterestConfig): Buffer {
    let buf = Buffer.allocUnsafe(0);
    param.values().forEach((val) => {
      if (val !== undefined) {
        buf = Buffer.concat([buf, val.toBuffer()]);
      }
    });
    return buf;
  }

  public static encodeCollateral(param: CollateralConfig): Buffer {
    let buf = Buffer.allocUnsafe(0);
    if (param.canBeCollateral && param.collateralFactor) {
      buf = Buffer.concat([buf, param.collateralFactor.toBuffer()]);
    }
    return buf;
  }
}

export class OceanDecoder {
  public static decode(buf: Buffer): PoolConfig {
    let offset = 0;

    const config: PoolConfig = {
      liquidationIncentive: undefined,
      closeFactor: undefined,
      tokens: []
    };

    offset = OceanDecoder.decodeOceanConfig(config, buf, offset);

    const tokens = [];
    while (offset < buf.length) {
      const r = OceanDecoder.decodeSingle(buf, offset);
      tokens.push(r[0]);
      offset = r[1];
    }
    config.tokens = tokens;

    return config;
  }

  public static decodeOceanConfig(config: PoolConfig, buf: Buffer, offset: number): number {
    const header = buf.readUInt8(offset);
    offset += 1;

    if (isBitSet(header, CloseFactorIndex)) {
      config.closeFactor = DEFAULT_PARAM.closeFactor;
    } else {
      config.closeFactor = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    if (isBitSet(header, LiquidationIncentiveIndex)) {
      config.liquidationIncentive = DEFAULT_PARAM.liquidationIncentive;
    } else {
      config.liquidationIncentive = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    return offset;
  }

  public static decodeSingle(buf: Buffer, offset: number): [TokenConfig, number] {
    const header = this.decodeHeader(buf.readUInt8(offset));
    offset += 1;

    const i = this.decodeInterest(buf, offset, header);
    const interest = i[0];
    offset = i[1];

    const underlying = Address.fromBuffer(buf, offset);
    offset += 20;

    const subscriptionId = new Uint16(buf.readUInt16BE(offset));
    offset += 2;

    const c = this.decodeCollateral(buf, offset, header);
    const collateral = c[0];
    offset = c[1];

    return [
      {
        underlying,
        subscriptionId,
        interest,
        collateral
      },
      offset
    ];
  }

  public static decodeHeader(n: number): Header {
    return {
      baseRatePerYear: isBitSet(n, DEFAULT_BIT_MASK.get('baseRatePerYear')!.index),
      multiplierPerYear: isBitSet(n, DEFAULT_BIT_MASK.get('multiplierPerYear')!.index),
      jumpMultiplierPerYear: isBitSet(n, DEFAULT_BIT_MASK.get('jumpMultiplierPerYear')!.index),
      kink: isBitSet(n, DEFAULT_BIT_MASK.get('kink')!.index),
      collateralFactor: isBitSet(n, DEFAULT_BIT_MASK.get('collateralFactor')!.index),
      canBeCollateral: isBitSet(n, DEFAULT_BIT_MASK.get('canBeCollateral')!.index)
    };
  }

  public static decodeCollateral(buf: Buffer, offset: number, header: Header): [CollateralConfig, number] {
    let collateralFactor;
    if (!header.canBeCollateral) {
      collateralFactor = new Uint16(0);
    } else if (header.collateralFactor) {
      collateralFactor = DEFAULT_PARAM.collateralFactor;
    } else {
      collateralFactor = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    return [
      {
        canBeCollateral: header.canBeCollateral,
        collateralFactor
      },
      offset
    ];
  }

  public static decodeInterest(buf: Buffer, offset: number, header: Header): [InterestConfig, number] {
    let baseRatePerYear;
    if (header.baseRatePerYear) {
      baseRatePerYear = DEFAULT_PARAM.baseRatePerYear;
    } else {
      baseRatePerYear = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    let multiplierPerYear;
    if (header.multiplierPerYear) {
      multiplierPerYear = DEFAULT_PARAM.multiplierPerYear;
    } else {
      multiplierPerYear = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    let jumpMultiplierPerYear;
    if (header.jumpMultiplierPerYear) {
      jumpMultiplierPerYear = DEFAULT_PARAM.jumpMultiplierPerYear;
    } else {
      jumpMultiplierPerYear = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }

    let kink;
    if (header.kink) {
      kink = DEFAULT_PARAM.kink;
    } else {
      kink = new Uint16(buf.readUInt16BE(offset));
      offset += 2;
    }
    return [new InterestConfig(baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink), offset];
  }
}
