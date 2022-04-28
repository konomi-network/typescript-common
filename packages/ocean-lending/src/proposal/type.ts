import Web3 from 'web3';

export enum ProposalType {
  NewOracle,
  NewOcean
}

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

export interface ProposalDetails {
  calldata(web3: Web3): string;
}

export abstract class BasePropsalDetails implements ProposalDetails {
  abstract calldata(web3: Web3): string;

  public static abi(): any {
    throw new Error('Override this method!');
  }

  public static methodSelector(web3: Web3): string {
    const abi = this.abi();
    const methodSignature = `${abi.name}(${abi.inputs.map((i: { type: any }) => i.type)})`;
    return web3.utils.keccak256(methodSignature).substr(0, 10);
  }
}
