import { Client } from "./client";
import { TxnOptions } from "./options";

export class OToken extends Client{
    public async mint(amount: BigInt, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.mint(amount.toString());
        await this.send()
    }
}