import { Account } from 'web3-core';
import { PoolConfig } from 'config';
import { OceanEncoder } from 'encoding';
import { TxnOptions } from 'options';
import Client from './client';
import { CREATE_POOL_ABI } from '../abi/oceanLending';
import Web3 from 'web3';

/**
 * KonomiOceanGovernor contract client
 */
export class OceanGovernor extends Client {
  // Object contains the target contract for the proposals
  // Keys are the proposal type and values are the contract addresses
  private callables: any;

  constructor(callables: any, web3: Web3, abi: any, address: string, account: Account) {
    super(web3, abi, address, account);
    this.callables = callables;
  }

  public async proposePool(
    pool: PoolConfig,
    leasePerod: string,
    poolOwner: string,
    options: TxnOptions,
    txnHashCallback?: (txnHash: string) => any,
    confirmationCallback?: (receipt: any) => any,
    errorCallback?: (error: Error, receipt: any) => any
  ): Promise<void> {
    const bytes = OceanEncoder.encode(pool).toString();
    const callData = this.web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePerod, poolOwner]);
    const target = this.callables.oceanLending!;
    const method = this.contract.methods.propose(target, callData);
    await this.send(
      method,
      await this.prepareTxn(method),
      options,
      txnHashCallback,
      confirmationCallback,
      errorCallback
    );
  }

  /**
   * Hash proposal params to get proposalId
   * @param addresses The addresses of proposed tokens
   * @param params The configurations of proposed tokens
   */
  public async hashProposal(addresses: string[], params: PoolConfig): Promise<BigInt> {
    const calldatas = OceanEncoder.encode(params);
    const proposalId = await this.contract.methods.hashProposal(addresses, calldatas).call();
    return proposalId;
  }

  /**
   * Execute the proposal by the proposal id
   * @param proposalId The id of the proposal
   * @param options The transaction configuration parameters
   */
  public async execute(proposalId: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.execute(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Cancel the proposal by the proposal id
   * Only admin allowed
   * @param proposalId The id of the proposal
   * @param options The transaction configuration parameters
   */
  public async cancel(proposalId: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.cancel(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Has the account been voted
   * @param proposalId The id of the proposal
   * @param account The address of the voter
   */
  public async hasVoted(proposalId: BigInt, account: Account): Promise<boolean> {
    const state = await this.contract.methods.hasVoted(proposalId, account.address).call();
    return state;
  }

  /**
   * Cast proposal vote by the proposal id
   * Only validator role allowed
   * @param proposalId The id of the proposal
   * @param voteType The type of vote
   * @param options The transaction configuration parameters
   */
  public async castVote(proposalId: BigInt, voteType: number, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.castVote(proposalId, voteType);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Cast proposal vote by the proposal id with a specific reason
   * Only validator role allowed
   * @param proposalId The id of the proposal
   * @param voteType The type of vote
   * @param options The transaction configuration parameters
   */
  public async castVoteWithReason(
    proposalId: BigInt,
    voteType: number,
    reason: string,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.castVoteWithReason(proposalId, voteType, reason);
    await this.send(method, await this.prepareTxn(method), options);
  }

  // ========================= Proposal lifecycle =========================
  /**
   * Derive the state of the proposal. Refer to ProposalState for full states
   * There are also no expired state. Once expired and no quorum, it is rejected
   * @param proposalId The id of the proposal
   */
  public async getState(proposalId: BigInt): Promise<BigInt> {
    const state = await this.contract.methods.state(proposalId).call();
    return state;
  }

  /**
   * Returns the details of the proposal
   * Returns the following fields of the contract:
   * forVotes, againstVotes, proposer, startBlock, endBlock
   * @param proposalId The id of the proposal
   */
  public async getProposalDetail(proposalId: BigInt): Promise<Map<string, string>> {
    const proposalDetailKey = ['forVotes', 'againstVotes', 'proposer', 'startBlock', 'endBlock'];

    const response = await this.contract.methods.getProposalDetail(proposalId).call();

    const proposalDetail = new Map();
    proposalDetailKey.forEach((val, index) => {
      proposalDetail.set(val, response[index]);
    });

    return proposalDetail;
  }

  // =========================  control authorization of upgrade methods =========================
  /**
   * Only admin allowed
   * @param options The transaction configuration parameters
   */
  public async pause(options: TxnOptions): Promise<void> {
    const method = this.contract.methods.pause();
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Only admin allowed
   * @param options The transaction configuration parameters
   */
  public async unpause(options: TxnOptions): Promise<void> {
    const method = this.contract.methods.unpause();
    await this.send(method, await this.prepareTxn(method), options);
  }

  // =========================  Protocol Parameters =========================
  /**
   * Only admin allowed
   * @param fee The fee needed to create a new proposal, Initial value is 1000 KONO
   * @param options The transaction configuration parameters
   */
  public async setProposalPayable(fee: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setProposalPayable(fee);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Only admin allowed
   * @param cancelThreshold The number of blocks before an admin can starting canceling. Initial value is around 3 days.
   * @param options The transaction configuration parameters
   */
  public async setCancelThreshold(cancelThreshold: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setCancelThreshold(cancelThreshold);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Only admin allowed
   * @param votingPeriod The number of blocks for a voting cycle. Initial value is around 3 days.
   * @param options The transaction configuration parameters
   */
  public async setVotingPeriod(votingPeriod: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.setVotingPeriod(votingPeriod);
    await this.send(method, await this.prepareTxn(method), options);
  }
}
