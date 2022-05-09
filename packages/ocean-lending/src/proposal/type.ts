import Web3 from 'web3';

// The proposal types, each type corresponds to 
// an operation that one can perform on the contracts
export enum ProposalType {
  // TODO: NewOracle,
  NewOcean
}

// The proposal object, should contain a lot more information
// such as voting related issues.
export interface Proposal {
  forVotes: number;
  againstVotes: number;
  startBlock: number;
  endBlock: number;
  proposer: string;
  targetContract: string;
  proposalDetail: ProposalDetails;
  proposalType: ProposalType;
}

/**
 * The details of the proposal. There could be many differernt implementations
 * of the interface. What matters is the ethereum calldata it generates.
 */
export interface ProposalDetails {
  /**
   * The ethereum transaction call data for the proposal.
   * @param web3 The web3 instance
   */
  calldata(web3: Web3): string;
}

export abstract class BasePropsalDetails implements ProposalDetails {
  abstract calldata(web3: Web3): string;

  /**
   * Returns the abi of the proposing method.
   */
  public static abi(): any {
    throw new Error('Override this method!');
  }

  /**
   * Solidity method selector based on the ABI
   * @param web3 The web3 instance
   * @returns The method selector in string
   */
  public static methodSelector(web3: Web3): string {
    const abi = this.abi();
    const methodSignature = `${abi.name}(${abi.inputs.map((i: { type: any }) => i.type)})`;
    // Only take the first 8 chars, first two being 0x for hex encoding
    return web3.utils.keccak256(methodSignature).substr(0, 10);
  }
}
