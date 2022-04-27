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
}

export interface ProposalDetails {
    methodSelector(web3: Web3): String;
    calldata(web3: Web3): String;
    abi(): any;
}

export abstract class BasePropsalDetails implements ProposalDetails {
    abstract abi(): any;
    abstract calldata(web3: Web3): String;

    public methodSelector(web3: Web3): String {
        const abi = this.abi();
        const methodSignature = `${abi.name}(${abi.inputs.map((i: { type: any }) => i.type)})`;
        return web3.utils.keccak256(methodSignature).substr(0, 10);
    }
}
