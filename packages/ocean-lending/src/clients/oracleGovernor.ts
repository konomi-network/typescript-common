import { Account } from "web3-core";
import { Client } from "./client";
import { TxnOptions } from "../options";
/**
 * OracleGovernor contract client.
 */
export class OracleGovernor extends Client {
  /**
   * Derive the state of the proposal. Refer to ProposalState for full states.
   * There are also no expired state. Once expired and no quorum, it is rejected.
   * @param proposalId The id of the proposal to check.
   */
  public async getState(proposalId: BigInt): Promise<BigInt> {
    const state = await this.contract.methods.state(proposalId).call();
    return state;
  }

  /**
   * Returns the details of the proposal.
   * Returns the following fields of the contract:
   * forVotes, againstVotes, externalStorageHash, startBlock,
   * endBlock, clientType, sourceCount, leasePeriod
   */
  public async getProposalDetail(
    proposalId: BigInt
  ): Promise<Map<string, string>> {
    const proposalDetailKey = [
      "forVotes",
      "againstVotes",
      "externalStorageHash",
      "startBlock",
      "endBlock",
      "clientType",
      "sourceCount",
      "leasePeriod",
    ];
    const response = await this.contract.methods
      .getProposalDetail(proposalId)
      .call();
    const proposalDetail = new Map();
    proposalDetailKey.forEach((val, index) => {
      proposalDetail.set(val, response[index]);
    });
    return proposalDetail;
  }

  /**
   * Propose a new currency in the Oracle. We only track the hash of the
   * proposal content. The actual content is store in decentralized storage.
   * @param symbol The currency info, 0 is for symbol and 1 is for slug.
   * @param slug The currency info, 0 is for symbol and 1 is for slug.
   * @param sources The data sources id.
   * @param clientType The client type of the subscription.
   * @param leasePeriod The number blocks for the subscription lease.
   * @param externalStorageHash The hash to identify the storage.
   */
  public async proposeCurrency(
    symbol: string,
    slug: string,
    source: Array<number>,
    clientType: string,
    leasePeriod: string,
    externalStorageHash: string,
    options: TxnOptions
  ) {
    const method = this.contract.methods.proposeCurrency(
      symbol,
      slug,
      source,
      clientType,
      leasePeriod,
      externalStorageHash
    );
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Execute the proposal by the proposal id. The execution is triggered only on chain
   * but it will be ran off-chain management by Konomi-Network.
   * An event will be published and there are event listeners for this event.
   * Only the proposer has the right to execute the proposal.
   * @param proposalId The id of the proposal
   */
  public async execute(proposalId: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.execute(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  /**
   * Cancel the proposal by the proposal id.
   * Users cannot cancel. Once proposed can only be rejected. No kono will be refunded.
   * Only admin can cancel and it is after certain blocks after end date and not executed.
   * @param proposalId The id of the proposal
   */
  public async cancel(proposalId: BigInt, options: TxnOptions): Promise<void> {
    const method = this.contract.methods.cancel(proposalId);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async hasVoted(proposalId: BigInt, account: Account): Promise<BigInt> {
    const state = await this.contract.methods
      .hasVoted(proposalId, account.address)
      .call();
    return state;
  }

  public async castVote(
    proposalId: BigInt,
    voteType: number,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.castVote(proposalId, voteType);
    await this.send(method, await this.prepareTxn(method), options);
  }

  public async castVoteWithReason(
    proposalId: BigInt,
    voteType: number,
    reason: string,
    options: TxnOptions
  ): Promise<void> {
    const method = this.contract.methods.castVoteWithReason(
      proposalId,
      voteType,
      reason
    );
    await this.send(method, await this.prepareTxn(method), options);
  }
}
