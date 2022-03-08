import Web3 from "web3";
import { Account } from "web3-core";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { OracleGovernor } from "../src/clients/oracleGovernor";

const status = new Map([
  ["0", "Active"],
  ["1", "Rejected"],
  ["2", "Approved"],
  ["3", "Executed"],
  ["4", "Canceled"],
]);

async function getState(oracleGovernor: OracleGovernor, proposalId: BigInt) {
  console.log("==== getState ====");
  const state = await oracleGovernor.getState(proposalId);
  console.log("state:", status.get(state.toString()));
  console.log("==== getState ====");
}

async function getProposalDetail(
  oracleGovernor: OracleGovernor,
  proposalId: BigInt
) {
  console.log("==== getProposalDetail ====");
  const proposalDetail = await oracleGovernor.getProposalDetail(proposalId);
  console.log("proposalDetail:\n", proposalDetail);
  console.log("==== getProposalDetail ====");
}

async function proposeCurrency(
  oracleGovernor: OracleGovernor,
  proposalId: BigInt
) {
  console.log("==== proposeCurrency ====");
  const proposalDetail = await oracleGovernor.getProposalDetail(proposalId);
  const symbol = String(proposalDetail.get("symbol"));
  const slug = String(proposalDetail.get("slug"));
  const source = [2];
  const clientType = String(proposalDetail.get("clientType"));
  const leasePeriod = String(proposalDetail.get("leasePeriod"));
  const externalStorageHash = String(proposalDetail.get("externalStorageHash"));

  await oracleGovernor.proposeCurrency(
    symbol,
    slug,
    source,
    clientType,
    leasePeriod,
    externalStorageHash,
    { confirmations: 3 }
  );
  console.log("==== proposeCurrency ====");
}

async function execute(oracleGovernor: OracleGovernor, proposalId: BigInt) {
  console.log("==== execute ====");
  const stateBefore = await oracleGovernor.getState(proposalId);
  console.log("state before execute: ", status.get(stateBefore.toString()));

  await oracleGovernor.execute(proposalId, { confirmations: 3 });

  const stateAfter = await oracleGovernor.getState(proposalId);
  console.log("state after execute: ", status.get(stateAfter.toString()));
  console.log("==== execute ====");
}

async function cancel(oracleGovernor: OracleGovernor, proposalId: BigInt) {
  console.log("==== cancel ====");
  const stateBefore = await oracleGovernor.getState(proposalId);
  console.log("state before cancel: ", status.get(stateBefore.toString()));

  await oracleGovernor.cancel(proposalId, { confirmations: 3 });

  const stateAfter = await oracleGovernor.getState(proposalId);
  console.log("state after cancel: ", status.get(stateAfter.toString()));
  console.log("==== cancel ====");
}

async function hasVoted(
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  account: Account
) {
  const state = await oracleGovernor.getState(proposalId);
  const hasVoted = await oracleGovernor.hasVoted(proposalId, account);
  console.log("state: ", status.get(state.toString()), "hasVoted: ", hasVoted);
  console.log("==== hasVoted ====");
}

async function castVote(
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  voteType: number,
  account: Account
) {
  console.log("==== castVote ====");
  const stateBefore = await oracleGovernor.getState(proposalId);
  let hasVoted = await oracleGovernor.hasVoted(proposalId, account);
  console.log(
    "state before castVote: ",
    status.get(stateBefore.toString()),
    "hasVoted: ",
    hasVoted
  );

  await oracleGovernor.castVote(proposalId, voteType, { confirmations: 3 });

  const stateAfter = await oracleGovernor.getState(proposalId);
  hasVoted = await oracleGovernor.hasVoted(proposalId, account);
  console.log(
    "state after castVote: ",
    status.get(stateAfter.toString()),
    "hasVoted: ",
    hasVoted
  );
  console.log("==== castVote ====");
}

async function castVoteWithReason(
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  voteType: number,
  reason: string,
  account: Account
) {
  console.log("==== castVoteWithReason ====");
  const stateBefore = await oracleGovernor.getState(proposalId);
  let hasVoted = await oracleGovernor.hasVoted(proposalId, account);
  console.log(
    "state before castVoteWithReason: ",
    status.get(stateBefore.toString()),
    "hasVoted: ",
    hasVoted
  );

  await oracleGovernor.castVoteWithReason(proposalId, voteType, reason, {
    confirmations: 3,
  });

  const stateAfter = await oracleGovernor.getState(proposalId);
  hasVoted = await oracleGovernor.hasVoted(proposalId, account);
  console.log(
    "state after castVoteWithReason: ",
    status.get(stateAfter.toString()),
    "hasVoted: ",
    hasVoted
  );
  console.log("==== castVoteWithReason ====");
}

async function main() {
  const config = readJsonSync("./config/config.json");

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(
      config.encryptedAccountJson,
      pw,
      web3
    );
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error("Cannot setup account");
  }

  console.log("Using account:", account.address);

  // load the oracleGovernor object
  const oracleGovernorAbi = readJsonSync("./config/oracleGovernor.json");
  const oracleGovernor = new OracleGovernor(
    web3,
    oracleGovernorAbi,
    config.oracleGovernor.address,
    account
  );

  // actual tests
  const proposalId = BigInt(
    "31460174923741090751995227965996190553828176918929754688521228662363341767331"
  );
  const voteType = 1;
  const voteReason = "this is the vote reason;";

  await getState(oracleGovernor, proposalId);
  await getProposalDetail(oracleGovernor, proposalId);
  await hasVoted(oracleGovernor, proposalId, account);
  await proposeCurrency(oracleGovernor, proposalId);
  await execute(oracleGovernor, proposalId);
  await cancel(oracleGovernor, proposalId);
  await castVote(oracleGovernor, proposalId, voteType, account);
  await castVoteWithReason(
    oracleGovernor,
    proposalId,
    voteType,
    voteReason,
    account
  );
}

main();
