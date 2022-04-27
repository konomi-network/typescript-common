import { NewOcean } from './detail/newOcean';
import { ProposalDetails, ProposalType } from './type';

export class PropsalFactory {
  public makeProposal(type: ProposalType, detail: { [key: string]: any }): ProposalDetails {
    switch (type) {
      case ProposalType.NewOcean:
        return new NewOcean(detail);
      default:
        throw new Error('Unknow proposal type');
    }
  }

  public fromHex(hex: string): ProposalDetails {
    throw new Error(hex);
    // switch (type) {
    //     case (ProposalType.NewOcean):
    //         throw "";
    //     default:
    //         throw "";
    // }
  }
}
