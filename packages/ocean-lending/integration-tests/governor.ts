import Web3 from 'web3';
import { Account } from 'web3-core';
import { randomInt } from 'crypto';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../src/reading';
import { KonomiGovernor } from '../src/clients/governor';
import { InterestConfig } from '../src/config';
import { Address, Uint16 } from '../src/types';
// import { isEqual } from 'lodash';
import { ProposalFactory } from '../src/proposal/factory';
import { ProposalType } from '../src/proposal/type';
import { CREATE_POOL_ABI } from '../src/abi/oceanLending';
import { OceanEncoder } from '../src/encoding';
import { ensure, sleep } from '../src/utils';

const status = new Map([
  ['0', 'Active'],
  ['1', 'Rejected'],
  ['2', 'Approved'],
  ['3', 'Executed'],
  ['4', 'Canceled']
]);

describe('OceanGovernor', () => {
  const config = readJsonSync('./config/config.json');
  const voter1Abi = readJsonSync('./config/oceanGovernor.json');
  const callables = {
    oceanLending: '0x17EB891f78F32a89961a39Cabf3413B7BcD628Cb'
  };
  const confirmations = { confirmations: 3 };
  const tokenA = {
    underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
    subscriptionId: new Uint16(1),
    interest: new InterestConfig(
      new Uint16(1001), // baseRatePerYear
      new Uint16(2002), // multiplierPerYear
      new Uint16(3003), // jumpMultiplierPerYear
      new Uint16(4004) // kink
    ),
    collateral: {
      canBeCollateral: false,
      collateralFactor: new Uint16(0)
    }
  };
  const tokenB = {
    underlying: Address.fromString('0x30cDBa5e339881c707E140A5E7fe27fE1835d0dA'),
    subscriptionId: new Uint16(1),
    interest: new InterestConfig(
      new Uint16(1001), // baseRatePerYear
      new Uint16(2002), // multiplierPerYear
      new Uint16(3003), // jumpMultiplierPerYear
      new Uint16(4005) // kink
    ),
    collateral: {
      canBeCollateral: true,
      collateralFactor: new Uint16(1001)
    }
  };
  const pool = {
    closeFactor: new Uint16(5000),
    liquidationIncentive: new Uint16(1080),
    tokens: [tokenA, tokenB]
  };
  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let adminAccount: Account;
  const voterAccounts = new Array<Account>();
  let poolOwner: string;
  let admin: KonomiGovernor;
  let voters: Array<KonomiGovernor>;
  let leasePeriod: string;
  const factory = new ProposalFactory(web3);

  beforeAll(async () => {
    if (config.encryptedAccountJson) {
      const pw = await readPassword();
      adminAccount = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
      adminAccount = loadWalletFromPrivate(config.privateKey, web3);
    } else {
      throw Error('Cannot setup account');
    }

    console.log('Using admin account:', adminAccount.address);

    for (let voterAccountConfig of config.voterAccounts) {
      let voterAccount: Account;
      if (voterAccountConfig.voterEncryptedAccountJson) {
        const pw = await readPassword();
        voterAccount = loadWalletFromEncyrptedJson(voterAccountConfig.voterEncryptedAccountJson, pw, web3);
      } else if (voterAccountConfig.voterPrivateKey) {
        voterAccount = loadWalletFromPrivate(voterAccountConfig.voterPrivateKey, web3);
      } else {
        throw Error('Cannot setup voterAccount');
      }
      voterAccounts.push(voterAccount);
    }
    voterAccounts.forEach((x) => console.log(x.address));

    poolOwner = adminAccount.address;

    // load the oceanGovernor object
    admin = new KonomiGovernor(callables, web3, voter1Abi, config.oceanGovernor.address, adminAccount, factory);
    voters = voterAccounts.map(
      (account) => new KonomiGovernor(callables, web3, voter1Abi, config.oceanGovernor.address, account, factory)
    );
  });

  beforeEach(() => {
    // make the proposal unique
    leasePeriod = '250000' + randomInt(10000);
  });

  it('propose new ocean', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: Number(leasePeriod),
      poolOwner: poolOwner
    });

    // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    // Get proposal detail
    const hash = await admin.hashProposal(callables.oceanLending, proposalDetail.calldata(web3));
    const proposal = await admin.getProposal(hash);

    expect(proposal.proposalDetail).toEqual(proposalDetail);
    expect(proposal.proposalType).toEqual(ProposalType.NewOcean);
    expect(proposal.againstVotes).toEqual(0);
    expect(proposal.forVotes).toEqual(0);
  });

  it('propose new oracle', async () => {
    const newOracleDetails = {
      externalStorageHash: 'QmWuw8KmSGeNqcGNpqkxTrWb2egHokvQnc7rqhZKE5BMvM',
      sourceCount: '3',
      leasePeriod: leasePeriod,
      clientType: '0',
      onBehalfOf: '0xe7A252739912F74c117FA37335f850f6f95Fbf70'
    };

    const proposalDetail = factory.makeProposal(ProposalType.NewOracle, newOracleDetails);

    // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    // Get proposal detail
    const hash = await admin.hashProposal(callables.oceanLending, proposalDetail.calldata(web3));
    const proposal = await admin.getProposal(hash);

    expect(proposal.proposalDetail.externalStorageHash).toEqual(newOracleDetails.externalStorageHash);
    expect(proposal.proposalDetail.sourceCount).toEqual(newOracleDetails.sourceCount);
    expect(proposal.proposalDetail.leasePeriod).toEqual(newOracleDetails.leasePeriod);
    expect(proposal.proposalDetail.clientType).toEqual(newOracleDetails.clientType);
    expect(proposal.proposalDetail.onBehalfOf).toEqual(newOracleDetails.onBehalfOf);
  });

  it('cast vote with approval vote', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 1; // approval vote
    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    // // Get proposal detail
    const proposalId = await admin.hashProposal(callables.oceanLending, callData);
    const proposalDetailBefore = await admin.getProposal(proposalId);
    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    const forVotesBefore = proposalDetailBefore.forVotes;
    const againstVotesBefore = proposalDetailBefore.againstVotes;

    console.log(
      `state before castVote:  ${stateBefore}, forVotesBefore: ${forVotesBefore}, againstVotesBefore: ${againstVotesBefore}`
    );

    ensure(
      stateBefore == 'Active' && forVotesBefore == 0 && againstVotesBefore == 0,
      `expect proposal status: Active, actual proposal status: ${stateBefore}`
    );
    expect(stateBefore).toEqual('Active');

    for (let voter of voters) {
      await voter.castVote(
        proposalId,
        voteType,
        confirmations,
        (hash: any) => console.log('hash obtained:', hash),
        (_receipt: any) => console.log('confirmed'),
        (error: any, _receipt: any) => console.log('error', error)
      );
    }

    await sleep(15000);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);
    console.log(hasVoted, 'hasVoted');

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    console.log(stateAfter, 'stateAfter');
    const proposalDetailAfter = await admin.getProposal(proposalId);
    const forVotesAfter = proposalDetailAfter.forVotes;
    const againstVotesAfter = proposalDetailAfter.againstVotes;
    console.log(
      `hasVoted: ${hasVoted}, state after castVote: ${stateAfter}, forVotesAfter: ${forVotesAfter}, againstVotesAfter: ${againstVotesAfter}`
    );
    ensure(stateAfter == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Approved');
  });

  it('execute', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);

    const voteType = 1; // approval vote
    const voteReason = ' this is the vote reason.';

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );
    console.log('execute start');

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);

    for (let voter of voters) {
      await voter.castVote(
        proposalId,
        voteType,
        confirmations,
        (hash: any) => console.log('hash obtained:', hash),
        (_receipt: any) => console.log('confirmed'),
        (error: any, _receipt: any) => console.log('error', error)
      );
    }
    await sleep(15000);

    const s = await admin.getState(proposalId);
    console.log('🚀 ~ file: oceanGovernor.ts ~ line 163 ~ it ~ s', s, typeof s);

    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    console.log('state before execute: ', stateBefore);
    ensure(stateBefore == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateBefore}`);
    expect(stateBefore).toEqual('Approved');

    await admin.execute(proposalId, { confirmations: 3 });

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    console.log('state after execute: ', stateAfter);
    ensure(stateAfter == 'Executed', `expect proposal status: Executed, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Executed');
  });

  it('cast vote with against vote', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 0; // against vote
    const voteReason = ' this is the vote reason.';

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    // Get proposal detail
    const proposalId = await admin.hashProposal(callables.oceanLending, callData);
    const proposalDetailBefore = await admin.getProposal(proposalId);
    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    const forVotesBefore = proposalDetailBefore.forVotes;
    const againstVotesBefore = proposalDetailBefore.againstVotes;

    console.log(
      `state before castVote:  ${stateBefore}, forVotesBefore: ${forVotesBefore}, againstVotesBefore: ${againstVotesBefore}`
    );

    ensure(
      stateBefore == 'Active' && forVotesBefore == 0 && againstVotesBefore == 0,
      `expect proposal status: Active, actual proposal status: ${stateBefore}`
    );
    expect(stateBefore).toEqual('Active');

    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }

    await sleep(15000);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    const proposalDetailAfter = await admin.getProposal(proposalId);
    const forVotesAfter = proposalDetailAfter.forVotes;
    const againstVotesAfter = proposalDetailAfter.againstVotes;
    console.log(
      `hasVoted: ${hasVoted}, state after castVote: ${stateAfter}, forVotesAfter: ${forVotesAfter}, againstVotesAfter: ${againstVotesAfter}`
    );
    ensure(stateAfter == 'Rejected', `expect proposal status: Rejected, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Rejected');
  });

  it('cast vote with with reason', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 0; // against vote
    const voteReason = ' this is the vote reason.';

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);
    const proposalDetailBefore = await admin.getProposal(proposalId);
    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    const forVotesBefore = proposalDetailBefore.forVotes;
    const againstVotesBefore = proposalDetailBefore.againstVotes;

    console.log(
      `state before castVote:  ${stateBefore}, forVotesBefore: ${forVotesBefore}, againstVotesBefore: ${againstVotesBefore}`
    );
    ensure(
      stateBefore == 'Active' && forVotesBefore == 0 && againstVotesBefore == 0,
      `expect proposal status: Active, actual proposal status: ${stateBefore}`
    );
    expect(stateBefore).toEqual('Active');

    for (let voter of voters) {
      await voter.castVoteWithReason(proposalId, voteType, voteReason, confirmations);
    }

    await sleep(15000);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    const proposalDetailAfter = await admin.getProposal(proposalId);
    const forVotesAfter = proposalDetailAfter.forVotes;
    const againstVotesAfter = proposalDetailAfter.againstVotes;

    console.log(
      `hasVoted: ${hasVoted}, state after castVote: ${stateAfter}, forVotesAfter: ${forVotesAfter}, againstVotesAfter: ${againstVotesAfter}`
    );
    ensure(stateAfter == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Approved');
  });

  it('execute', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 1;

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    console.log('execute start');

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);

    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }
    await sleep(15000);

    const s = await admin.getState(proposalId);
    console.log('🚀 ~ file: oceanGovernor.ts ~ line 163 ~ it ~ s', s, typeof s);

    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    console.log('state before execute: ', stateBefore);
    ensure(stateBefore == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateBefore}`);
    expect(stateBefore).toEqual('Approved');

    await admin.execute(proposalId, { confirmations: 3 });

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    console.log('state after execute: ', stateAfter);
    ensure(stateAfter == 'Executed', `expect proposal status: Executed, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Executed');
  });

  it('cancel', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );
    const proposalId = await admin.hashProposal(callables.oceanLending, callData);

    const voteType = 1;
    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }
    await sleep(15000);

    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    console.log('state before cancel: ', stateBefore);
    ensure(stateBefore == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateBefore}`);
    expect(stateBefore).toEqual('Approved');

    await admin.cancel(proposalId, { confirmations: 3 });

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    console.log('state after execute: ', stateAfter);
    ensure(stateAfter == 'Canceled', `expect proposal status: Canceled, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Canceled');
  });

  it('cast vote with approval vote', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 1; // approval vote

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);
    const proposalDetailBefore = await admin.getProposal(proposalId);
    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    const forVotesBefore = proposalDetailBefore.forVotes;
    const againstVotesBefore = proposalDetailBefore.againstVotes;

    console.log(
      `state before castVote:  ${stateBefore}, forVotesBefore: ${forVotesBefore}, againstVotesBefore: ${againstVotesBefore}`
    );
    ensure(
      stateBefore == 'Active' && forVotesBefore == 0 && againstVotesBefore == 0,
      `expect proposal status: Active, actual proposal status: ${stateBefore}`
    );
    expect(stateBefore).toEqual('Active');

    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }

    await sleep(15000);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    const proposalDetailAfter = await admin.getProposal(proposalId);
    const forVotesAfter = proposalDetailAfter.forVotes;
    const againstVotesAfter = proposalDetailAfter.againstVotes;
    console.log(
      `hasVoted: ${hasVoted}, state after castVote: ${stateAfter}, forVotesAfter: ${forVotesAfter}, againstVotesAfter: ${againstVotesAfter}`
    );
    ensure(stateAfter == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Approved');
  });

  it('cast vote with against vote', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);
    const voteType = 0; // against vote

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'getParams');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);
    const proposalDetailBefore = await admin.getProposal(proposalId);
    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    const forVotesBefore = proposalDetailBefore.forVotes;
    const againstVotesBefore = proposalDetailBefore.againstVotes;

    console.log(
      `state before castVote:  ${stateBefore}, forVotesBefore: ${forVotesBefore}, againstVotesBefore: ${againstVotesBefore}`
    );
    ensure(
      stateBefore == 'Active' && forVotesBefore == 0 && againstVotesBefore == 0,
      `expect proposal status: Active, actual proposal status: ${stateBefore}`
    );
    expect(stateBefore).toEqual('Active');

    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }

    await sleep(15000);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    const proposalDetailAfter = await admin.getProposal(proposalId);
    const forVotesAfter = proposalDetailAfter.forVotes;
    const againstVotesAfter = proposalDetailAfter.againstVotes;

    console.log(
      `hasVoted: ${hasVoted}, state after castVote: ${stateAfter}, forVotesAfter: ${forVotesAfter}, againstVotesAfter: ${againstVotesAfter}`
    );
    ensure(stateAfter == 'Rejected', `expect proposal status: Rejected, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Rejected');
  });

  it('execute', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);

    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'res');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    console.log('execute start');

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);

    const voteType = 1;
    for (let voter of voters) {
      await voter.castVote(proposalId, voteType, confirmations);
    }
    await sleep(15000);

    const s = await admin.getState(proposalId);
    console.log('🚀 ~ file: oceanGovernor.ts ~ line 163 ~ it ~ s', s, typeof s);

    const stateBefore = status.get((await admin.getState(proposalId)).toString());
    console.log('state before execute: ', stateBefore);
    ensure(stateBefore == 'Approved', `expect proposal status: Approved, actual proposal status: ${stateBefore}`);
    expect(stateBefore).toEqual('Approved');

    await admin.execute(proposalId, { confirmations: 3 });

    const stateAfter = status.get((await admin.getState(proposalId)).toString());
    console.log('state after execute: ', stateAfter);
    ensure(stateAfter == 'Executed', `expect proposal status: Executed, actual proposal status: ${stateAfter}`);
    expect(stateAfter).toEqual('Executed');
  });

  it('key flow test', async () => {
    const bytes = `0x${OceanEncoder.encode(pool).toString('hex')}`;
    const callData = web3.eth.abi.encodeFunctionCall(CREATE_POOL_ABI, [bytes, leasePeriod, poolOwner]);

    // Propose a pool
    await admin.setVotingThreshold(51, 100, confirmations);
    await admin.setQuorumThreshold(2, confirmations);

    const res = await admin.getParams();
    console.log(res, 'res');

    const proposalDetail = factory.makeProposal(ProposalType.NewOcean, {
      pool,
      leasePeriod: leasePeriod,
      poolOwner: poolOwner
    });

    // //  // Propose a pool
    await admin.propose(
      proposalDetail,
      confirmations,
      (hash: any) => console.log('hash obtained:', hash),
      (_receipt: any) => console.log('confirmed'),
      (error: any, _receipt: any) => console.log('error', error)
    );

    const proposalId = await admin.hashProposal(callables.oceanLending, callData);

    const hasVoted = await admin.hasVoted(proposalId, adminAccount.address);
    const state = status.get((await admin.getState(proposalId)).toString());
    await getActiveProposals(admin);

    console.log(state, 'state', hasVoted, 'hasVoted');
  });
});

async function getActiveProposals(admin: KonomiGovernor) {
  console.log('==== getActiveProposals begin ====');
  const activeProposals = await admin.getActiveProposals();
  console.log('activeProposals:', activeProposals);
  console.log('==== getActiveProposals end ====');
}
