import { ensure } from "./utils";

export class Uint16 {
    public static MAX = 65535;
    private inner: number;

    constructor(inner: number) {
        this.inner = inner;
    }

    public appendTo(buf: Buffer): Buffer {
        this.isValid();
        return Buffer.concat([buf, this.toBuffer()]);
    }

    public toBuffer(): Buffer {
        const b = Buffer.allocUnsafe(2);
        b.writeUInt16BE(this.inner);
        return b;
    }

    private isValid(): void {
        if (Number.isInteger(this.inner) && 0 <= this.inner && this.inner <= Uint16.MAX) {
            return;
        }
        throw Error(`Invalid uint16 ${this.inner}`);
    }
}

export class Uint64 {
    public static MAX = BigInt("18446744073709551615");
    private inner: BigInt;

    constructor(inner: BigInt) {
        this.inner = inner;
    }

    public appendTo(buf: Buffer): Buffer {
        this.isValid();
        return Buffer.concat([buf, this.toBuffer()]);
    }

    public toBuffer(): Buffer {
        const b = Buffer.allocUnsafe(8);
        b.writeBigUInt64BE(this.inner.valueOf());
        return b;
    }

    private isValid(): void {
        if (Number.isInteger(this.inner) && BigInt(0) <= this.inner && this.inner <= Uint64.MAX) {
            return;
        }
        throw Error(`Invalid uint16 ${this.inner}`);
    }
}

export class Address {
    public static LEN = 20;
    private inner: Buffer;

    constructor(addressStr: string) {
        ensure(addressStr.startsWith("0x"), `Invalid address: ${addressStr}`);
        ensure(addressStr.length === 42, `Invalid address: ${addressStr}`);
        this.inner = Buffer.from(addressStr.substring(2), "hex");
    }

    public appendTo(buf: Buffer): Buffer {
        this.isValid();
        return Buffer.concat([buf, this.toBuffer()]);
    }

    public toBuffer(): Buffer {
        return this.inner;
    }

    private isValid(): void {
        ensure(this.inner.length === Address.LEN, `Invalid uint16 ${this.inner}`);
    }
}