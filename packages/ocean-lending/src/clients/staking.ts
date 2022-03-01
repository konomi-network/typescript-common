import { Client } from "./client";
import { TxnOptions } from "../options";

/**
 * Staking V1 contract client.
 */
export class StakingV1 extends Client {
    /**
     * Supply reward in to the contract. Only allowed by admin.
     * @param amount The amount to withdraw
     */
    public async supplyReward(amount: string, options: TxnOptions): Promise<void> {
        const method = this.contract.methods.supplyReward(amount);
        await this.send(method, await this.prepareTxn(method), options);
    }

    /**
     * Supply reward in to the contract. Only allowed by admin.
     * @param amount The amount to withdraw
     */
    public async stakingToken(): Promise<string> {
        return this.contract.methods.stakingToken().call();
    }
}