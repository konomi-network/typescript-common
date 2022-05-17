import { BasePropsalDetails } from '../type';
import Web3 from 'web3';

// The `create` function call on Oracle subscription contract
const NEW_SUBSCRIPTION_ABI: any = {
  inputs: [
    {
      internalType: 'string',
      name: '_externalStorageHash',
      type: 'string'
    },
    {
      internalType: 'uint256',
      name: '_sourceCount',
      type: 'uint256'
    },
    {
      internalType: 'uint256',
      name: '_leasePeriod',
      type: 'uint256'
    },
    {
      internalType: 'uint8',
      name: '_clientType',
      type: 'uint8'
    },
    {
      internalType: 'address',
      name: '_onBehalfOf',
      type: 'address'
    }
  ],
  name: 'newSubscription',
  outputs: [
    {
      internalType: 'uint64',
      name: '',
      type: 'uint64'
    },
    {
      internalType: 'address',
      name: '',
      type: 'address'
    }
  ],
  stateMutability: 'nonpayable',
  type: 'function'
};

/**
 * Proposal to create a new oracle subscription
 */
export class NewOracle extends BasePropsalDetails {
  // Note that for all the types here, we are using string
  // to represent them, to avoid conversion issues
  public readonly externalStorageHash: string;

  public readonly sourceCount: string;

  public readonly leasePeriod: string;

  public readonly clientType: string;

  public readonly onBehalfOf: string;

  constructor(detail: { [key: string]: any }) {
    super();
    this.externalStorageHash = BasePropsalDetails.ensureDefined(detail.externalStorageHash);
    this.sourceCount = BasePropsalDetails.ensureDefined(detail.sourceCount);
    this.leasePeriod = BasePropsalDetails.ensureDefined(detail.leasePeriod);
    this.clientType = BasePropsalDetails.ensureDefined(detail.clientType);
    this.onBehalfOf = BasePropsalDetails.ensureDefined(detail.onBehalfOf);
  }

  public static abi(): any {
    return NEW_SUBSCRIPTION_ABI;
  }

  public calldata(web3: Web3): string {
    return web3.eth.abi.encodeFunctionCall(NEW_SUBSCRIPTION_ABI, [
      this.externalStorageHash,
      this.sourceCount,
      this.leasePeriod,
      this.clientType,
      this.onBehalfOf
    ]);
  }

  /**
   * Convert hex encoded string into a NewOracle proposal detail
   * @param hex The hex string, note that the method selector should not be included
   * @param web3 The web3 instance
   */
  public static fromHex(hex: string, web3: Web3): NewOracle {
    const callData = web3.eth.abi.decodeParameters(['string', 'uint256', 'uint256', 'uint8', 'address'], hex);
    return new NewOracle({
      externalStorageHash: callData[0],
      sourceCount: callData[1],
      leasePeriod: callData[2],
      clientType: callData[3],
      onBehalfOf: callData[4]
    });
  }
}
