import Web3 from 'web3';
import { TxnOptions } from 'options';
import Client, { TxnCallbacks, TAccount } from './client';
import { ProposalFactory } from '../proposal/factory';
import { Proposal, ProposalDetails } from '../proposal/type';

/**
 * KonomiOceanGovernor contract client
 */
export class KonomiGovernor extends Client {
  // When we are proposing to the governance, only certain target
  // contracts can be allowed for execution. As such, callables hold
  // the list of contracts allowed.
  // Keys are the proposal type and values are the contract addresses
  // The keys are: oceanLending, oracleSubscription
  private callables: any;

  private proposalFactory: ProposalFactory;

  constructor(
    callables: any,
    web3: Web3,
    abi: any,
    address: string,
    account: TAccount,
    proposalFactory: ProposalFactory
  ) {
    super(web3, abi, address, account);
    this.callables = callables;
    this.proposalFactory = proposalFactory;
  }

  /**
   * Make a new proposal
   * @param proposal The proposal detail
   * @param options The transaction options
   * @param callbacks The callbacks for the transaction when hash received and stuff
   */
  public async propose(proposal: ProposalDetails, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const callData = proposal.calldata(this.web3);
    const target = this.callables.oceanLending!;
    const method = this.contract.methods.propose(target, callData);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
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
  public async execute(proposalId: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.execute(proposalId);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  /**
   * Cancel the proposal by the proposal id
   * Only admin allowed
   * @param proposalId The id of the proposal
   * @param options The transaction configuration parameters
   */
  public async cancel(proposalId: string, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.cancel(proposalId);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  /**
   * Has the account been voted
   * @param proposalId The id of the proposal
   * @param account The address of the voter
   */
  public async hasVoted(proposalId: string, account: string): Promise<boolean> {
    const state = await this.contract.methods.hasVoted(proposalId, account).call();
    return state;
  }

  /**
   * Cast proposal vote by the proposal id
   * Only validator role allowed
   * @param proposalId The id of the proposal
   * @param voteType The type of vote
   * @param options The transaction configuration parameters
   */
  public async castVote(
    proposalId: string,
    voteType: number,
    options: TxnOptions,
    ...callbacks: TxnCallbacks
  ): Promise<void> {
    const method = this.contract.methods.castVote(proposalId, voteType);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
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
    options: TxnOptions,
    ...callbacks: TxnCallbacks
  ): Promise<void> {
    const method = this.contract.methods.castVoteWithReason(proposalId, voteType, reason);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
  }

  // ========================= Proposal lifecycle =========================
  /**
   * Derive the state of the proposal. Refer to ProposalState for full states
   * There are also no expired state. Once expired and no quorum, it is rejected
   * @param proposalId The id of the proposal
   */
  public async getState(proposalId: string): Promise<number> {
    const state: string = await this.contract.methods.state(proposalId).call();
    return Number(state);
  }

  /**
   * Returns the details of the proposal
   * Returns the following fields of the contract:
   * forVotes, againstVotes, proposer, startBlock, endBlock
   * @param proposalId The id of the proposal
   */
  public async getProposal(proposalId: string): Promise<Proposal> {
    const response = await this.contract.methods.getProposalDetails(proposalId).call();
    const propsalDetails = this.proposalFactory.fromHex(response[6][0], this.web3);

    return {
      proposer: response[2],
      forVotes: Number(response[0]),
      againstVotes: Number(response[1]),
      startBlock: Number(response[3]),
      endBlock: Number(response[4]),
      targetContract: response[5][0],
      proposalDetail: propsalDetails.details,
      proposalType: propsalDetails.type
    };
  }

  /**
   * get all active proposals from contract.
   */
  public async getActiveProposals(): Promise<Array<string>> {
    const activeProposals = await this.contract.methods.getActiveProposals().call();
    return activeProposals;
  }

  /**
   * Derive proposing fee value
   */
  public async getPayable(): Promise<string> {
    const result = this.contract.methods.proposalPayable().call();
    return result;
  }

  public getParams(): Promise<string> {
    const result = this.contract.methods.getParams().call();
    return result;
  }

  /**
   * Check role of address is validator or not
   */
  public async isValidator(address: string): Promise<boolean> {
    const result = this.contract.methods.hasRole('VALIDATOR', address).call();
    return result;
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
  public async setProposalPayable(fee: BigInt, options: TxnOptions, ...callbacks: TxnCallbacks): Promise<void> {
    const method = this.contract.methods.setProposalPayable(fee);
    await this.send(method, await this.prepareTxn(method), options, ...callbacks);
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

  /**
   * Only admin allowed
   * VotingThreshold = totalVotes(proposalId) * num / den;
   */
  public async setVotingThreshold(num: number, den: number, options: TxnOptions) {
    const method = this.contract.methods.setVotingThreshold(num, den);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async setQuorumThreshold(num: number, options: TxnOptions) {
    const method = this.contract.methods.setQuorumThreshold(num);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * @param amount The amount of tokens to withdraw.
   * @param options The transaction configuration parameters
   */
  public async withdraw(amount: BigInt, options: TxnOptions) {
    const method = this.contract.methods._withdraw(amount);
    await this.send(method, await this.prepareTxn(method), options);
  }
}
