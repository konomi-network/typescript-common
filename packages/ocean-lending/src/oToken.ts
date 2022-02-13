import Web3 from "web3";
import { Account } from "web3-core";
import { Client } from "./client";
import { ERC20Token } from "./erc20Token";
import { TxnOptions } from "./options";

export interface OTokenParameter {
    initialExchangeRate: number,
    underlying: string,
    comptroller: string,
}

export class OToken extends Client {
    readonly parameters: OTokenParameter;
    private readonly underlyingDecimals = 18;

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

    public async redeem(amount: BigInt, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.redeem(amount.toString());
        let failed = null;
        await this.send(
            method,
            await this.prepareTxn(method),
            options,
            (receipt) => {
                failed = this.detectFailedEvents(receipt.events);
            }
        );

        if (failed != null) { throw new Error(failed); }
    }

    public async borrowRatePerBlock(): Promise<BigInt> {
        const borrowRate = await this.contract.methods.borrowRatePerBlock().call();
        return BigInt(borrowRate / Math.pow(10, this.underlyingDecimals));
    }

    public async borrow(amount: number, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.borrow(amount.toString());
        await this.send(method, await this.prepareTxn(method), options);
    }

    public async borrowBalanceCurrent(address: string): Promise<number> {
        return await this.contract.methods.borrowBalanceCurrent(address).call();
    }

    public async approve(amount: number, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.approve(this.address, amount.toString());
        await this.send(method, await this.prepareTxn(method), options);
    }

    public async repayBorrow(amount: number, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.repayBorrow(amount.toString());
        await this.send(method, await this.prepareTxn(method), options);
    }

    public async balanceOf(address: string): Promise<BigInt> {
        const b = await this.contract.methods.balanceOf(address).call();
        return BigInt(b);
    }

    public async liquidateBorrow(borrower: string, amount: number, cTokenCollateral: string, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.liquidateBorrow(borrower, amount.toString(), cTokenCollateral);
        await this.send(method, await this.prepareTxn(method), options);
    }

    // public convertFromUnderlying(amount: BigInt): BigInt {

    // }

    private detectFailedEvents(events: any) {
        Object.keys(events).forEach(key => {
            if (key === "Failure") {
                const error = events.Failure["returnValues"];
                if (error.error != 0) {
                    return error.info;
                } else {
                    return null;
                }
            }
        });
    }
}