import Web3 from 'web3';
import { NewOcean } from './detail/newOcean';
import { ProposalDetails, ProposalType } from './type';

export class ProposalFactory {
  private methodSelectors = new Map<string, any[]>();

  constructor(web3: Web3) {
    this.methodSelectors.set(NewOcean.methodSelector(web3), [NewOcean, ProposalType.NewOcean]);
  }

  public makeProposal(type: ProposalType, detail: { [key: string]: any }): ProposalDetails {
    switch (type) {
      case ProposalType.NewOcean:
        return new NewOcean(detail);
      default:
        throw new Error('Unknow proposal type');
    }
  }

  public fromHex(hex: string, we3: Web3): { type: ProposalType; details: ProposalDetails } {
    const methodSelector = hex.substr(0, 10);
    const cls = this.methodSelectors.get(methodSelector);

    if (cls === undefined) {
      throw new Error('Unrecoginised method');
    }

    const details: ProposalDetails = cls[0].fromHex(hex.substr(10), we3);
    return { type: cls[1], details };
  }
}
