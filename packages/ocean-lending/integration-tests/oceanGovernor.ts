import Web3 from "web3";
import { Account } from "web3-core";
import {
    ensure,
    loadWalletFromEncyrptedJson,
    loadWalletFromPrivate,
    readJsonSync,
    readPassword,
} from "../src/utils";
import { OceanGovernor } from "../src/clients/oceanGovernor";
import { PoolConfig, TokenConfig } from "../src/config";
import { Address, Uint64 } from "../src/types";
import { buffer } from "stream/consumers";

const status = new Map([
    ["0", "Active"],
    ["1", "Rejected"],
    ["2", "Approved"],
    ["3", "Executed"],
    ["4", "Canceled"],
]);

async function getState(oceanGovernor: OceanGovernor, proposalId: BigInt) {
    console.log("==== getState begin ====");
    const state = await oceanGovernor.getState(proposalId);
    console.log("state:", status.get(state.toString()));
    console.log("==== getState end ====");
}

async function getProposalDetail(
    oceanGovernor: OceanGovernor,
    proposalId: BigInt
) {
    console.log("==== getProposalDetail begin ====");
    const proposalDetail = await oceanGovernor.getProposalDetail(proposalId);
    console.log("proposalDetail:\n", proposalDetail);
    console.log("==== getProposalDetail end ====");
}

async function proposeMulti(
    oceanGovernor: OceanGovernor,
    addresses: string[],
    params: PoolConfig
) {
    console.log("==== proposeCurrency begin ====");
    const proposalId = await oceanGovernor.proposeMulti(
        addresses,
        params
    );

    const hashedProposalId = await oceanGovernor.hashProposal(
        addresses,
        params
    );
    const proposalDetail = await oceanGovernor.getProposalDetail(proposalId);

    console.log(
        "hashed proposalId: ",
        proposalId,
        "proposalDetail:\n",
        proposalDetail
    );

    ensure(
        proposalId == hashedProposalId,
        "proposed currency data is not inconsistent"
    );
    console.log("==== propose end ====");
}

async function execute(oceanGovernor: OceanGovernor, proposalId: BigInt) {
    console.log("==== execute begin ====");
    const stateBefore = await oceanGovernor.getState(proposalId);
    console.log("state before execute: ", status.get(stateBefore.toString()));

    await oceanGovernor.execute(proposalId, { confirmations: 3 });

    const stateAfter = await oceanGovernor.getState(proposalId);
    console.log("state after execute: ", status.get(stateAfter.toString()));
    console.log("==== execute end ====");
}

async function cancel(oceanGovernor: OceanGovernor, proposalId: BigInt) {
    console.log("==== cancel begin ====");
    const stateBefore = await oceanGovernor.getState(proposalId);
    console.log("state before cancel: ", status.get(stateBefore.toString()));

    await oceanGovernor.cancel(proposalId, { confirmations: 3 });

    const stateAfter = await oceanGovernor.getState(proposalId);
    console.log("state after cancel: ", status.get(stateAfter.toString()));
    console.log("==== cancel end ====");
}

async function hasVoted(
    oceanGovernor: OceanGovernor,
    proposalId: BigInt,
    account: Account
) {
    const state = await oceanGovernor.getState(proposalId);
    const hasVoted = await oceanGovernor.hasVoted(proposalId, account);
    console.log("state: ", status.get(state.toString()), "hasVoted: ", hasVoted);
    console.log("==== hasVoted ====");
}

async function castVote(
    oceanGovernor: OceanGovernor,
    proposalId: BigInt,
    voteType: number,
    account: Account
) {
    console.log("==== castVote begin ====");
    const stateBefore = await oceanGovernor.getState(proposalId);
    let hasVoted = await oceanGovernor.hasVoted(proposalId, account);
    const proposalDetailBefore = await oceanGovernor.getProposalDetail(
        proposalId
    );

    console.log(
        "state before castVote: ",
        status.get(stateBefore.toString()),
        "hasVoted: ",
        hasVoted,
        "forVotesBefore: ",
        proposalDetailBefore.get("forVotes"),
        "againstVotesBefore: ",
        proposalDetailBefore.get("againstVotes")
    );

    await oceanGovernor.castVote(proposalId, voteType, { confirmations: 3 });

    const proposalDetailAfter = await oceanGovernor.getProposalDetail(
        proposalId
    );
    const stateAfter = await oceanGovernor.getState(proposalId);
    hasVoted = await oceanGovernor.hasVoted(proposalId, account);
    console.log(
        "state after castVote: ",
        status.get(stateAfter.toString()),
        "hasVoted: ",
        hasVoted,
        "forVotesAfter: ",
        proposalDetailAfter.get("forVotes"),
        "againstVotesAfter: ",
        proposalDetailAfter.get("againstVotes")
    );
    console.log("==== castVote end ====");
}

async function castVoteWithReason(
    oceanGovernor: OceanGovernor,
    proposalId: BigInt,
    voteType: number,
    reason: string,
    account: Account
) {
    console.log("==== castVoteWithReason begin ====");
    const stateBefore = await oceanGovernor.getState(proposalId);
    let hasVoted = await oceanGovernor.hasVoted(proposalId, account);
    const proposalDetailBefore = await oceanGovernor.getProposalDetail(
        proposalId
    );
    console.log(
        "state before castVoteWithReason: ",
        status.get(stateBefore.toString()),
        "hasVoted: ",
        hasVoted,
        "forVotesBefore: ",
        proposalDetailBefore.get("forVotes"),
        "againstVotesBefore: ",
        proposalDetailBefore.get("againstVotes")
    );

    await oceanGovernor.castVoteWithReason(proposalId, voteType, reason, {
        confirmations: 3,
    });

    const stateAfter = await oceanGovernor.getState(proposalId);
    hasVoted = await oceanGovernor.hasVoted(proposalId, account);
    const proposalDetailAfter = await oceanGovernor.getProposalDetail(
        proposalId
    );
    console.log(
        "state after castVoteWithReason: ",
        status.get(stateAfter.toString()),
        "hasVoted: ",
        hasVoted,
        "forVotesAfter: ",
        proposalDetailAfter.get("forVotes"),
        "againstVotesAfter: ",
        proposalDetailAfter.get("againstVotes")
    );
    console.log("==== castVoteWithReason end ====");
}

async function main() {
    const config = readJsonSync("./config/config.json");

    // const config = readJsonSync("/home/daokun/workspace/ocean-lending-client/packages/test-config/config.json")
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

    // load the oceanGovernor object
    const oceanGovernorAbi = readJsonSync("./config/oceanGovernor.json");
    const oceanGovernor = new OceanGovernor(
        web3,
        oceanGovernorAbi,
        config.oceanGovernor.address,
        account
    );

    // actual tests
    const confirmations = { confirmations: 3 };
    // const voteType = 1;
    // const voteReason = "this is the test vote reason;";
    // const addresses = ["address1", "address2"]
    // const address = new Address(new Buffer(account.address));
    // const params: PoolConfig = {
    //     tokens: [
    //         {
    //             underlying: address,
    //             subscriptionId: new Uint64(1),
    //             collateral: 1,
    //         }
    //     ],
    // }

    await oceanGovernor.pause(confirmations);

    // const hashedProposalId = await oceanGovernor.hashProposal(
    //     addresses,
    //     params
    // );

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
