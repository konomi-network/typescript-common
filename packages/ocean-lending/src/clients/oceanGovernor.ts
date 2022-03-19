import { Account } from 'web3-core';
import { PoolConfig } from 'config';
import { OceanDecoder, OceanEncoder } from '../encoding';
import { TxnOptions } from 'options';
import Client from './client';
import { CREATE_POOL_ABI } from '../abi/oceanLending';
import Web3 from 'web3';

export interface ProposalDetails {
  forVotes: number;
  againstVotes: number;
  proposer: string;
  startBlock: BigInt;
  endBlock: BigInt;
  pool: PoolConfig;
  targetContract: string;
  leasePeriod: BigInt;
  poolOwner: string;
}

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
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
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
   * @param address The target contract address
   * @param pool The configurations of proposed tokens
   */
  public async hashProposal(address: string, bytes: string): Promise<string> {
    const proposalId = await this.contract.methods.hashProposal([address], [bytes]).call();
    return proposalId;
  }

  /**
   * Execute the proposal by the proposal id
   * @param proposalId The id of the proposal
   * @param options The transaction configuration parameters
   */
  public async execute(proposalId: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.execute(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Cancel the proposal by the proposal id
   * Only admin allowed
   * @param proposalId The id of the proposal
   * @param options The transaction configuration parameters
   */
  public async cancel(proposalId: string, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.cancel(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Has the account been voted
   * @param proposalId The id of the proposal
   * @param account The address of the voter
   */
  public async hasVoted(proposalId: string, account: Account): Promise<boolean> {
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
  public async castVote(proposalId: string, voteType: number, options: TxnOptions): Promise<void> {
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
    proposalId: string,
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
  public async getState(proposalId: string): Promise<number> {
    const state = await this.contract.methods.state(proposalId).call();
    return state;
  }

  /**
   * Returns the details of the proposal
   * Returns the following fields of the contract:
   * forVotes, againstVotes, proposer, startBlock, endBlock
   * @param proposalId The id of the proposal
   */
  public async getProposalDetail(proposalId: string): Promise<ProposalDetails> {
    const response = await this.contract.methods.getProposalDetails(proposalId).call();
    const callData = this.web3.eth.abi.decodeParameters(['bytes', 'uint256', 'address'], response[6][0].substring(10));

    return {
      forVotes: response[0],
      againstVotes: response[1],
      proposer: response[2],
      startBlock: response[3],
      endBlock: response[4],
      targetContract: response[5][0],
      pool: OceanDecoder.decode(Buffer.from(callData[0].substring(2), 'hex')),
      leasePeriod: BigInt(callData[1]),
      poolOwner: callData[2]
    };
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