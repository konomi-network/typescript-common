import { Client } from './client';
import { TxnOptions } from '../options';

export interface Feed {
	decimals: number,
	value: BigInt,
	roundId: number,
	updateBlockNumber: BigInt
};

export class OracleFeedV2 extends Client {
	public async submit(roundId: number, value: string, submitter: string, options: TxnOptions): Promise<void> {
		const buf = this.encode(roundId, value);
		const method = this.contract.methods.submit(buf, submitter);
		await this.send(method, await this.prepareTxn(method), options);
	}

	public async version(): Promise<number> {
		const b = await this.contract.methods.VERSION().call();
        return Number(b);
	}

	public async getFeed(): Promise<Feed> {
		const { 0: decimals, 1: value, 2: roundId, 3: updateBlockNumber } = await this.contract.methods.getFeed().call();
		return { decimals, value, roundId, updateBlockNumber };
	}

	private encode(roundId: number, value: string): Buffer {
		const buf = Buffer.allocUnsafe(33);
		buf.writeUInt8(roundId, 0);
	  
		let result = BigInt(value).toString(16);
		result = result.padStart(64, '0');
	  
		buf.write(result, 1, 'hex');
		return buf;
	};  
}
