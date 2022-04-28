import { PoolConfig } from 'config';
import { OceanDecoder, OceanEncoder } from '../../encoding';
import { BasePropsalDetails } from '../type';
import Web3 from 'web3';

// The `create` function call on Ocean Lending contract
const CREATE_POOL_ABI: any = {
  inputs: [
    {
      internalType: 'bytes',
      name: '_poolData',
      type: 'bytes'
    },
    {
      internalType: 'uint256',
      name: '_leasePeriod',
      type: 'uint256'
    },
    {
      internalType: 'address',
      name: '_onBehalfOf',
      type: 'address'
    }
  ],
  name: 'create',
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

export class NewOcean extends BasePropsalDetails {
  public readonly leasePeriod: number;

  public readonly poolOwner: string;

  public readonly pool: PoolConfig;

  constructor(detail: { [key: string]: any }) {
    super();
    this.leasePeriod = detail.leasePeriod;
    this.poolOwner = detail.poolOwner;
    this.pool = detail.pool;
  }

  public static abi(): any {
    return CREATE_POOL_ABI;
  }

  public calldata(web3: Web3): string {
    const bytes = `0x${OceanEncoder.encode(this.pool).toString('hex')}`;
    return web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, this.leasePeriod.toString(), this.poolOwner]);
  }

  /**
   * Convert hex encoded string into a NewOcean proposal detail
   * @param hex The hex string, note that the method selector should not be included
   * @param web3 The web3 instance
   */
  public static fromHex(hex: string, web3: Web3): NewOcean {
    const callData = web3.eth.abi.decodeParameters(['bytes', 'uint256', 'address'], hex);
    return new NewOcean({
      leasePeriod: Number(callData[1]),
      pool: OceanDecoder.decode(Buffer.from(callData[0].substring(2), 'hex')),
      poolOwner: callData[2]
    });
  }
}
