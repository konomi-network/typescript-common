import Web3 from 'web3';
import { Account } from 'web3-core';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../src/utils';
import { OceanGovernor } from '../src/clients/oceanGovernor';
import { InterestConfig } from '../src/config';
import { Address, Uint16, Uint64 } from '../src/types';
import { OceanEncoder } from '../src/encoding';
import { CREATE_POOL_ABI } from '../src/abi/oceanLending';
import { assert } from 'console';

const status = new Map([
  ['0', 'Active'],
  ['1', 'Rejected'],
  ['2', 'Approved'],
  ['3', 'Executed'],
  ['4', 'Canceled']
]);

async function getState(oceanGovernor: OceanGovernor, proposalId: BigInt) {
  console.log('==== getState begin ====');
  const state = await oceanGovernor.getState(proposalId);
  console.log('state:', status.get(state.toString()));
  console.log('==== getState end ====');
}

// async function getProposalDetail(oceanGovernor: OceanGovernor, proposalId: BigInt) {
//   console.log('==== getProposalDetail begin ====');
//   const proposalDetail = await oceanGovernor.getProposalDetail(proposalId);
//   console.log('proposalDetail:\n', proposalDetail);
//   console.log('==== getProposalDetail end ====');
// }

async function execute(oceanGovernor: OceanGovernor, proposalId: BigInt) {
  console.log('==== execute begin ====');
  const stateBefore = await oceanGovernor.getState(proposalId);
  console.log('state before execute: ', status.get(stateBefore.toString()));

  await oceanGovernor.execute(proposalId, { confirmations: 3 });

  const stateAfter = await oceanGovernor.getState(proposalId);
  console.log('state after execute: ', status.get(stateAfter.toString()));
  console.log('==== execute end ====');
}

async function cancel(oceanGovernor: OceanGovernor, proposalId: BigInt) {
  console.log('==== cancel begin ====');
  const stateBefore = await oceanGovernor.getState(proposalId);
  console.log('state before cancel: ', status.get(stateBefore.toString()));

  await oceanGovernor.cancel(proposalId, { confirmations: 3 });

  const stateAfter = await oceanGovernor.getState(proposalId);
  console.log('state after cancel: ', status.get(stateAfter.toString()));
  console.log('==== cancel end ====');
}

async function hasVoted(oceanGovernor: OceanGovernor, proposalId: BigInt, account: Account) {
  const state = await oceanGovernor.getState(proposalId);
  const hasVoted = await oceanGovernor.hasVoted(proposalId, account);
  console.log('state: ', status.get(state.toString()), 'hasVoted: ', hasVoted);
  console.log('==== hasVoted ====');
}

// async function castVote(oceanGovernor: OceanGovernor, proposalId: BigInt, voteType: number, account: Account) {
//   console.log('==== castVote begin ====');
//   const stateBefore = await oceanGovernor.getState(proposalId);
//   let hasVoted = await oceanGovernor.hasVoted(proposalId, account);
//   const proposalDetailBefore = await oceanGovernor.getProposalDetail(proposalId);

//   console.log(
//     'state before castVote: ',
//     status.get(stateBefore.toString()),
//     'hasVoted: ',
//     hasVoted,
//     'forVotesBefore: ',
//     proposalDetailBefore.get('forVotes'),
//     'againstVotesBefore: ',
//     proposalDetailBefore.get('againstVotes')
//   );

//   await oceanGovernor.castVote(proposalId, voteType, { confirmations: 3 });

//   const proposalDetailAfter = await oceanGovernor.getProposalDetail(proposalId);
//   const stateAfter = await oceanGovernor.getState(proposalId);
//   hasVoted = await oceanGovernor.hasVoted(proposalId, account);
//   console.log(
//     'state after castVote: ',
//     status.get(stateAfter.toString()),
//     'hasVoted: ',
//     hasVoted,
//     'forVotesAfter: ',
//     proposalDetailAfter.get('forVotes'),
//     'againstVotesAfter: ',
//     proposalDetailAfter.get('againstVotes')
//   );
//   console.log('==== castVote end ====');
// }

// async function castVoteWithReason(
//   oceanGovernor: OceanGovernor,
//   proposalId: BigInt,
//   voteType: number,
//   reason: string,
//   account: Account
// ) {
//   console.log('==== castVoteWithReason begin ====');
//   const stateBefore = await oceanGovernor.getState(proposalId);
//   let hasVoted = await oceanGovernor.hasVoted(proposalId, account);
//   const proposalDetailBefore = await oceanGovernor.getProposalDetail(proposalId);
//   console.log(
//     'state before castVoteWithReason: ',
//     status.get(stateBefore.toString()),
//     'hasVoted: ',
//     hasVoted,
//     'forVotesBefore: ',
//     proposalDetailBefore.get('forVotes'),
//     'againstVotesBefore: ',
//     proposalDetailBefore.get('againstVotes')
//   );

//   await oceanGovernor.castVoteWithReason(proposalId, voteType, reason, {
//     confirmations: 3
//   });

//   const stateAfter = await oceanGovernor.getState(proposalId);
//   hasVoted = await oceanGovernor.hasVoted(proposalId, account);
//   const proposalDetailAfter = await oceanGovernor.getProposalDetail(proposalId);
//   console.log(
//     'state after castVoteWithReason: ',
//     status.get(stateAfter.toString()),
//     'hasVoted: ',
//     hasVoted,
//     'forVotesAfter: ',
//     proposalDetailAfter.get('forVotes'),
//     'againstVotesAfter: ',
//     proposalDetailAfter.get('againstVotes')
//   );
//   console.log('==== castVoteWithReason end ====');
// }

async function main() {
  const config = readJsonSync('./config/config.json');

  // const config = readJsonSync("/home/daokun/workspace/ocean-lending-client/packages/test-config/config.json")
  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error('Cannot setup account');
  }

  console.log('Using account:', account.address);

  // load the oceanGovernor object
  const oceanGovernorAbi = readJsonSync('./config/oceanGovernor.json');
  const callables = {
    oceanLending: '0x17EB891f78F32a89961a39Cabf3413B7BcD628Cb'
  };
  const oceanGovernor = new OceanGovernor(callables, web3, oceanGovernorAbi, config.oceanGovernor.address, account);

  // actual tests
  const confirmations = { confirmations: 3 };
  //   await oceanGovernor.setVotingPeriod(BigInt(30), confirmations);

  const tokenA = {
    underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
    subscriptionId: new Uint64(BigInt(1)),
    interest: new InterestConfig(
      new Uint16(1001), // baseRatePerYear
      new Uint16(2002), // multiplierPerYear
      new Uint16(3003), // jumpMultiplierPerYear
      new Uint16(4004) // kink
    ),
    collateral: {
      canBeCollateral: false,
      collateralFactor: new Uint16(1001),
      liquidationIncentive: new Uint16(2)
    }
  };
  const tokenB = {
    underlying: Address.fromString('0x30cDBa5e339881c707E140A5E7fe27fE1835d0dA'),
    subscriptionId: new Uint64(BigInt(1)),
    interest: new InterestConfig(
      new Uint16(1001), // baseRatePerYear
      new Uint16(2002), // multiplierPerYear
      new Uint16(3003), // jumpMultiplierPerYear
      new Uint16(4005) // kink
    ),
    collateral: {
      canBeCollateral: true,
      collateralFactor: new Uint16(1001),
      liquidationIncentive: new Uint16(1060)
    }
  };

  const leasePerod = "2589571";
  const poolOwner = account.address;
  const pool = { tokens: [tokenA, tokenB] };

  // Propose a pool
  // await oceanGovernor.proposePool(
  //   pool,
  //   leasePerod,
  //   poolOwner,
  //   confirmations,
  //   (hash) => console.log("hash obtained:", hash),
  //   (receipt) => console.log("confirmed"),
  //   (error, receipt) => console.log("error", error)
  // );

  const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
  const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePerod, poolOwner]);
  const hash = await oceanGovernor.hashProposal(callables.oceanLending, callData);
  const proposal = await oceanGovernor.getProposalDetail(hash);
  // TODO: assert expected are equal

  // await oceanGovernor.pause(confirmations);

  // await proposeMulti(
  //     oceanGovernor,
  //     addresses,
  //     params
  // );
  // await getState(oceanGovernor, hashedProposalId);
  // await getProposalDetail(oceanGovernor, hashedProposalId);
  // await hasVoted(oceanGovernor, hashedProposalId, account);
  // await execute(oceanGovernor, hashedProposalId);
  // await cancel(oceanGovernor, hashedProposalId);
  // await castVote(oceanGovernor, hashedProposalId, voteType, account);
  // await castVoteWithReason(
  //     oceanGovernor,
  //     hashedProposalId,
  //     voteType,
  //     voteReason,
  //     account
  // );
}

main();
