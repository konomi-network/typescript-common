/// This file contains the simplified ABI for Ocean Lending
/// related contracts. This way we don't require that many
/// bytes for ABIs.

// The `create` function call on Ocean Lending contract
export const CREATE_POOL_ABI: any = {
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
