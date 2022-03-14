import { Client } from './client';
import { TxnOptions } from 'options';

/**
 * Staking V1 contract client.
 */
class StakingV1 extends Client {
  /**
   * Supply reward in to the contract. Only allowed by admin.
   * @param amount The amount to withdraw
   */
  public async supplyReward(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.supplyReward(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Withdraw amount into the contract.
   * @notice If the staking has ended, use withdrawAll to withdraw deposit.
   * @param amount The amount to deposit
   */
  public async withdraw(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.withdraw(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * withdrawAll deposit and reward of user stake into the contract.
   */
  public async withdrawAll(options: TxnOptions): Promise<void> {
    const method = this.contract.methods.withdrawAll();
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Deposit amount into the contract.
   * @param amount The amount to deposit
   */
  public async deposit(amount: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.deposit(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Get the staking metadata of the account passed in.
   * Returns the total amount deposited and total rewards
   * of the user.
   * @param account The account to check
   */
  public async stakeOf(address: string): Promise<[BigInt, BigInt]> {
    const s = await this.contract.methods.getUserStake(address).call();
    const depositedAmount = BigInt(s['0']);
    const totalRewards = BigInt(s['1']);
    return [depositedAmount, totalRewards];
  }
}

export default StakingV1;
export { StakingV1 };
