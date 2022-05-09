import Web3 from 'web3';
import { NewOcean } from './detail/newOcean';
import { ProposalDetails, ProposalType } from './type';

/**
 * Proposal factory is the factory pattern for generating different
 * proposals based on the type and detail.
 */
export class ProposalFactory {
  private methodSelectors = new Map<string, any[]>();

  constructor(web3: Web3) {
    // Note: in the constructor, we initialized the methodselectors for different proposal types
    // TODO: maybe we can do dynamic loading if we have more proposals.
    this.methodSelectors.set(NewOcean.methodSelector(web3), [NewOcean, ProposalType.NewOcean]);
  }

  /**
   * Make a new proposal from the type and detail to proposal details
   * @param type The proposal type
   * @param detail The detail to the proposal, key value pair of different parameters 
   * @returns The proposal detail object
   */
  public makeProposal(type: ProposalType, detail: { [key: string]: any }): ProposalDetails {
    switch (type) {
      case ProposalType.NewOcean:
        return new NewOcean(detail);
      default:
        throw new Error('Unknow proposal type');
    }
  }

  /**
   * Decodes the proposal from a hex string
   * @param hex The hex string
   * @param we3 The web3 instance
   * @returns The type and proposal detail
   */
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
