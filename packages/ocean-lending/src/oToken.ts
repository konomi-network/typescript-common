import Web3 from "web3";
import { Account } from "web3-core";
import { Client } from "./client";
import { TxnOptions } from "./options";

export interface OTokenParameter {
    initialExchangeRate: number
}

export class OToken extends Client{
    readonly parameters: OTokenParameter;

    constructor(
        web3: Web3,
        abi: any,
        address: string,
        account: Account,
        parameters: OTokenParameter
    ) {
        super(web3, abi, address, account);
        this.parameters = parameters;
    }

    public async mint(amount: BigInt, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.mint(amount.toString());
        await this.send(method, await this.prepareTxn(method), options);
    }

    public async balanceOf(address: string): Promise<BigInt> {
        const b = await this.contract.methods.balanceOf(address).call();
        console.log(b);
        return BigInt(b);
    }
}