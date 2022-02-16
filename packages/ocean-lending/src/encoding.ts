import { CollateralConfig, InterestConfig, PoolConfig, TokenConfig } from "./config";

class BitMask {
    readonly mask: number;
    readonly index: number;

    constructor(mask: number, index: number) {
        this.mask = mask;
        this.index = index;
    }
}

/**
 * Only 6 of the 8 bits are used, 2 extra bits are reserved
 */
const DEFAULT_BIT_MASK: Map<string, BitMask> = new Map([
    ["baseRatePerYear", new BitMask(0x1, 1)],
    ["multiplierPerYear", new BitMask(0x2, 2)],
    ["jumpMultiplierPerYear", new BitMask(0x4, 3)],
    ["kink", new BitMask(0x8, 4)],
    ["collateralFactor", new BitMask(0x10, 5)],
    ["liquidationIncentive", new BitMask(0x20, 6)],
]);

export class OceanEncoder {
    public static encode(params: PoolConfig): Buffer {
        return Buffer.allocUnsafe(0);
    }

    public static encodeSingle(param: TokenConfig): Buffer {
        return Buffer.concat([
            this.encodeHeader(param),
            this.encodeInterest(param.interest),
            this.encodeCollateral(param.collateral),
            param.subscriptionId.toBuffer(),
            param.underlying.toBuffer(),
        ]);
    }

    private static encodeHeader(para: TokenConfig): Buffer {
        let n = 0;

        Object.keys(para.interest).forEach((k: string) => {
            n = n | 1 << DEFAULT_BIT_MASK.get(k)!.index;
        })

        if (!para.collateral.collateralFactor) {
            n = n | 1 << DEFAULT_BIT_MASK.get('collateralFactor')!.index;
        }
        
        if (!para.collateral.liquidationIncentive) {
            n = n | 1 << DEFAULT_BIT_MASK.get('liquidationIncentive')!.index;
        }

        let b = Buffer.allocUnsafe(1);
        b.writeUInt8(n, 0);

        return b;
    }

    private static encodeInterest(param: InterestConfig): Buffer {
        return Buffer.allocUnsafe(0);
    }

    private static encodeCollateral(param: CollateralConfig): Buffer {
        return Buffer.allocUnsafe(0);
    }
}

export class OceanDecoder {
    public static decode(buf: Buffer): PoolConfig {
        throw new Error();
    }    
}