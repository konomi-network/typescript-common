import { buffer } from "stream/consumers";
import { ensure } from "./utils";

export interface Bufferable {
    /**
     * Append to the buffer
     * @param buf The buf to append to
     */
    appendTo(buf: Buffer): Buffer;

    /**
     * Convert to buffer
     */
    toBuffer(): Buffer;

    /**
     * Get the number of bytes
     */
    byteLen(): number;
}

export class Uint16 implements Bufferable {
    public static MAX = 65535;
    public static BYTE_LEN = 2;
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

    public byteLen(): number {
        return Uint16.BYTE_LEN;
    }

    private isValid(): void {
        if (Number.isInteger(this.inner) && 0 <= this.inner && this.inner <= Uint16.MAX) {
            return;
        }
        throw Error(`Invalid uint16 ${this.inner}`);
    }
}

export class Uint64 implements Bufferable {
    public static MAX = BigInt("18446744073709551615");
    public static BYTE_LEN = 8;
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

    public byteLen(): number {
        return Uint64.BYTE_LEN;
    }

    private isValid(): void {
        if (Number.isInteger(this.inner) && BigInt(0) <= this.inner && this.inner <= Uint64.MAX) {
            return;
        }
        throw Error(`Invalid uint16 ${this.inner}`);
    }
}

export class Address implements Bufferable {
    public static BYTE_LEN = 20;
    private inner: Buffer;

    constructor(inner: Buffer) { this.inner = inner; }

    public static fromString(addressStr: string): Address {
        ensure(addressStr.startsWith("0x"), `Invalid address: ${addressStr}`);
        ensure(addressStr.length === 42, `Invalid address: ${addressStr}`);
        return new Address(Buffer.from(addressStr.substring(2), "hex"));
    }

    public static fromBuffer(buf: Buffer, offset: number): Address {
        return new Address(buf.subarray(offset, offset + this.BYTE_LEN));
    }

    public appendTo(buf: Buffer): Buffer {
        this.isValid();
        return Buffer.concat([buf, this.toBuffer()]);
    }

    public toBuffer(): Buffer {
        return this.inner;
    }

    public byteLen(): number {
        return Address.BYTE_LEN;
    }

    public toString(): string {
        return `0x${this.inner.toString("hex")}`;
    }

    private isValid(): void {
        ensure(this.inner.length === Address.BYTE_LEN, `Invalid uint16 ${this.inner}`);
    }
}