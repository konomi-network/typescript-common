"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleGovernor = void 0;
const client_1 = require("./client");
/**
 * OracleGovernor contract client.
 */
class OracleGovernor extends client_1.Client {
    /**
     * Derive the state of the proposal. Refer to ProposalState for full states.
     * There are also no expired state. Once expired and no quorum, it is rejected.
     * @param proposalId The id of the proposal to check.
     */
    getState(proposalId) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.contract.methods.state(proposalId).call();
            return state;
        });
    }
    /**
     * Returns the details of the proposal.
     * Returns the following fields of the contract:
     * forVotes, againstVotes, externalStorageHash, startBlock,
     * endBlock, clientType, sourceCount, leasePeriod
     */
    getProposalDetail(proposalId) {
        return __awaiter(this, void 0, void 0, function* () {
            const proposalDetailKey = [
                "forVotes",
                "againstVotes",
                "externalStorageHash",
                "startBlock",
                "endBlock",
                "clientType",
                "sourceCount",
                "leasePeriod",
            ];
            const response = yield this.contract.methods
                .getProposalDetail(proposalId)
                .call();
            const proposalDetail = new Map();
            proposalDetailKey.forEach((val, index) => {
                proposalDetail.set(val, response[index]);
            });
            return proposalDetail;
        });
    }
    /**
     * Derive the hash of the proposal
     * @param symbol The currency info, 0 is for symbol and 1 is for slug.
     * @param slug The currency info, 0 is for symbol and 1 is for slug.
     * @param sources The data sources id.
     * @param clientType The client type of the subscription.
     * @param externalStorageHash The hash to identify the storage.
     */
    hashProposal(symbol, slug, sources, clientType, externalStorageHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const proposalId = yield this.contract.methods
                .hashProposal(symbol, slug, sources, clientType, externalStorageHash)
                .call();
            return BigInt(proposalId);
        });
    }
    /**
     * Propose a new currency in the Oracle. We only track the hash of the
     * proposal content. The actual content is store in decentralized storage.
     * @param symbol The currency info, 0 is for symbol and 1 is for slug.
     * @param slug The currency info, 0 is for symbol and 1 is for slug.
     * @param sources The data sources id.
     * @param clientType The client type of the subscription.
     * @param leasePeriod The number blocks for the subscription lease.
     * @param externalStorageHash The hash to identify the storage.
     */
    proposeCurrency(symbol, slug, source, clientType, leasePeriod, externalStorageHash, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.proposeCurrency(symbol, slug, source, clientType, leasePeriod, externalStorageHash);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Execute the proposal by the proposal id. The execution is triggered only on chain
     * but it will be ran off-chain management by Konomi-Network.
     * An event will be published and there are event listeners for this event.
     * Only the proposer has the right to execute the proposal.
     * @param proposalId The id of the proposal
     */
    execute(proposalId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.execute(proposalId);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Cancel the proposal by the proposal id.
     * Users cannot cancel. Once proposed can only be rejected. No kono will be refunded.
     * Only admin can cancel and it is after certain blocks after end date and not executed.
     * @param proposalId The id of the proposal
     */
    cancel(proposalId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.cancel(proposalId);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    hasVoted(proposalId, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.contract.methods
                .hasVoted(proposalId, account.address)
                .call();
            return state;
        });
    }
    castVote(proposalId, voteType, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.castVote(proposalId, voteType);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    castVoteWithReason(proposalId, voteType, reason, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.castVoteWithReason(proposalId, voteType, reason);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
}
exports.OracleGovernor = OracleGovernor;
//# sourceMappingURL=OracleGovernor.js.map