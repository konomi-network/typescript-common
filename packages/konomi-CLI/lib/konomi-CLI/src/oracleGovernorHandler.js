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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOracleGovernorCommand = exports.parseOracleGovernorConfiguration = exports.hasVoted = exports.cancel = exports.execute = exports.getProposalId = exports.proposeCurrency = exports.getProposalDetail = exports.state = void 0;
const web3_1 = __importDefault(require("web3"));
const commander_1 = require("commander");
const erc20Token_1 = require("../../ocean-lending/src/clients/erc20Token");
const oToken_1 = require("../../ocean-lending/src/clients/oToken");
const OracleGovernor_1 = require("../../ocean-lending/src/clients/OracleGovernor");
const logger_1 = __importDefault(require("./logger"));
const utils_1 = require("../../ocean-lending/src/utils");
const STATUS = new Map([
    ["0", "Active"],
    ["1", "Rejected"],
    ["2", "Approved"],
    ["3", "Executed"],
    ["4", "Canceled"],
]);
function state(account, token, oracleGovernor, proposalId) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const state = yield oracleGovernor.getState(proposalId);
        logger_1.default.info("erc20: %o, proposalId: %o, state: %o", erc20Before, proposalId, STATUS.get(state.toString()));
    });
}
exports.state = state;
function getProposalDetail(account, token, oracleGovernor, proposalId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, proposalDetail] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getProposalDetail(proposalId),
        ]);
        logger_1.default.info("erc20: %o, proposalId: %o, proposalDetail: %o", erc20Before, proposalId, proposalDetail);
    });
}
exports.getProposalDetail = getProposalDetail;
function proposeCurrency(account, token, oracleGovernor, symbol, slug, sources, clientType, leasePeriod, externalStorageHash, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, symbol: %o, slug: %o, sources: %o, clientType: %o, leasePeriod: %o, externalStorageHash: %o", erc20Before, symbol, slug, sources, clientType, leasePeriod, externalStorageHash);
        yield oracleGovernor.proposeCurrency(symbol, slug, sources, clientType, leasePeriod, externalStorageHash, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const proposalId = yield oracleGovernor.hashProposal(symbol, slug, sources, clientType, externalStorageHash);
        const proposalDetail = yield oracleGovernor.getProposalDetail(proposalId);
        logger_1.default.info("erc20After: %o, proposalId: %o, proposalDetail: %o", erc20After, proposalId, proposalDetail);
    });
}
exports.proposeCurrency = proposeCurrency;
function getProposalId(account, token, oracleGovernor, symbol, slug, sources, clientType, leasePeriod, externalStorageHash) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const proposalId = yield oracleGovernor.hashProposal(symbol, slug, sources, clientType, externalStorageHash);
        logger_1.default.info("erc20: %o, symbol: %o, slug: %o, sources: %o, clientType: %o, leasePeriod: %o, externalStorageHash: %o, proposalId: %o", erc20Before, symbol, slug, sources, clientType, leasePeriod, externalStorageHash, proposalId);
    });
}
exports.getProposalId = getProposalId;
function execute(account, token, oracleGovernor, proposalId, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, stateBefore] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
        ]);
        logger_1.default.info("erc20Before: %o, proposalId: %o, stateBefore: %o", erc20Before, proposalId, STATUS.get(stateBefore.toString()));
        yield oracleGovernor.execute(proposalId, confirmations);
        const [erc20After, stateAfter] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
        ]);
        logger_1.default.info("erc20After: %o, proposalId: %o, stateAfter: %o", erc20After, proposalId, STATUS.get(stateAfter.toString()));
    });
}
exports.execute = execute;
function cancel(account, token, oracleGovernor, proposalId, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, stateBefore] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
        ]);
        logger_1.default.info("erc20Before: %o, proposalId: %o, stateBefore: %o", erc20Before, proposalId, STATUS.get(stateBefore.toString()));
        yield oracleGovernor.cancel(proposalId, confirmations);
        const [erc20After, stateAfter] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
        ]);
        logger_1.default.info("erc20After: %o, proposalId: %o, stateAfter: %o", erc20After, proposalId, STATUS.get(stateAfter.toString()));
    });
}
exports.cancel = cancel;
function hasVoted(account, token, oracleGovernor, proposalId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, state, voted] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
            oracleGovernor.hasVoted(proposalId, account),
        ]);
        logger_1.default.info("erc20: %o, proposalId: %o, state: %o, voted: %o", erc20Before, proposalId, STATUS.get(state.toString()), voted);
    });
}
exports.hasVoted = hasVoted;
function castVote(account, token, oracleGovernor, proposalId, voteType, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, stateBefore, proposalDetailBefore] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
            oracleGovernor.getProposalDetail(proposalId),
        ]);
        logger_1.default.info("erc20Before: %o, proposalId: %o, stateBefore: %o, forVotesBefore: %o, againstVotesBefore: %o", erc20Before, proposalId, STATUS.get(stateBefore.toString()), proposalDetailBefore.get("forVotes"), proposalDetailBefore.get("againstVotes"));
        yield oracleGovernor.castVote(proposalId, voteType, confirmations);
        const [erc20After, stateAfter, proposalDetailAfter] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
            oracleGovernor.getProposalDetail(proposalId),
        ]);
        logger_1.default.info("erc20After: %o, proposalId: %o, stateAfter: %o, voteType: %o, forVotesAfter: %o, againstVotesAfter: %o", erc20After, proposalId, STATUS.get(stateAfter.toString()), voteType, proposalDetailAfter.get("forVotes"), proposalDetailAfter.get("againstVotes"));
    });
}
function castVoteWithReason(account, token, oracleGovernor, proposalId, voteType, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, stateBefore, proposalDetailBefore] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
            oracleGovernor.getProposalDetail(proposalId),
        ]);
        logger_1.default.info("erc20Before: %o, proposalId: %o, stateBefore: %o, voteType: %o, reason: %o, forVotesAfter: %o, againstVotesAfter: %o", erc20Before, proposalId, STATUS.get(stateBefore.toString()), voteType, reason, proposalDetailBefore.get("forVotes"), proposalDetailBefore.get("againstVotes"));
        yield oracleGovernor.castVoteWithReason(proposalId, voteType, reason, {
            confirmations: 3,
        });
        const [erc20After, stateAfter, proposalDetailAfter] = yield Promise.all([
            token.balanceOf(account.address),
            oracleGovernor.getState(proposalId),
            oracleGovernor.getProposalDetail(proposalId),
        ]);
        logger_1.default.info("erc20After: %o, proposalId: %o, stateAfter: %o, forVotesAfter: %o, againstVotesAfter: %o", erc20After, proposalId, STATUS.get(stateAfter.toString()), proposalDetailAfter.get("forVotes"), proposalDetailAfter.get("againstVotes"));
    });
}
/**
 * Parse oracleGovernor Configuration json file.
 */
function parseOracleGovernorConfiguration(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = (0, utils_1.readJsonSync)(options.configPath);
        const web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(config.nodeUrl));
        let account;
        if (config.encryptedAccountJson) {
            const pw = yield (0, utils_1.readPassword)();
            account = (0, utils_1.loadWalletFromEncyrptedJson)(config.encryptedAccountJson, pw, web3);
        }
        else if (config.privateKey) {
            account = (0, utils_1.loadWalletFromPrivate)(config.privateKey, web3);
        }
        else {
            logger_1.default.error("Cannot setup account");
            throw Error("Cannot setup account");
        }
        logger_1.default.info("Using account: %o", account.address);
        // load the oToken object
        const oTokenAbi = (0, utils_1.readJsonSync)(options.oToken);
        const oToken = new oToken_1.OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);
        // load the erc20 token object
        const erc20Abi = (0, utils_1.readJsonSync)(options.erc20);
        const token = new erc20Token_1.ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);
        // load the oracleGovernor object
        const oracleGovernorAbi = (0, utils_1.readJsonSync)(options.oracleGovernor);
        const oracleGovernor = new OracleGovernor_1.OracleGovernor(web3, oracleGovernorAbi, config.oracleGovernor.address, account);
        return [account, token, oracleGovernor, config];
    });
}
exports.parseOracleGovernorConfiguration = parseOracleGovernorConfiguration;
function makeOracleGovernorCommand() {
    // Add oracleGovernor subcommad
    const oracleGovernorCmd = new commander_1.Command("proposal");
    oracleGovernorCmd
        .description("execute oracleGovernor command")
        .requiredOption("-c, --config-path <path>", "configuration json path")
        .option("-o, --oToken <path>", "oracleGovernor oToken configuration json path", "../ocean-lending/config/oToken.json")
        .option("-e, --erc20 <path>", "oracleGovernor erc20 configuration json path", "../ocean-lending/config/erc20.json")
        .option("-e, --oracleGovernor <path>", "oracleGovernor configuration json path", "../ocean-lending/config/oracleGovernor.json");
    // Add stakes subcommad
    oracleGovernorCmd
        .command("state")
        .description("derive the state of the proposal")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: state started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield state(account, token, oracleGovernor, options.proposalId);
        logger_1.default.info("OracleGovernor: state sucess!");
    }));
    // Add proposalDetail subcommad
    oracleGovernorCmd
        .command("details")
        .description("fetch the details of the proposal")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: proposalDetail started, configPath: %o,", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield getProposalDetail(account, token, oracleGovernor, options.proposalId);
        logger_1.default.info("OracleGovernor: proposalDetail sucess!");
    }));
    // Add hashProposal subcommad
    oracleGovernorCmd
        .command("hash")
        .description("hash the proposal's properties to get proposalId")
        .requiredOption("-s, --symbol <str>", "the symbol of proposal")
        .requiredOption("-u, --slug <str>", "the slug of proposal")
        .requiredOption("-r, --sources <array>", "the sources of proposal, splited by ','")
        .requiredOption("-t, --clientType <str>", "the clientType of proposal")
        .requiredOption("-l, --leasePeriod <str>", "the leasePeriod of proposal")
        .requiredOption("-x, --externalStorageHash <str>", "the externalStorageHash of proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: hashProposal started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield getProposalId(account, token, oracleGovernor, options.symbol, options.slug, String(options.sources)
            .split(",")
            .map((s) => {
            return Number(s);
        }), options.clientType, options.leasePeriod, options.externalStorageHash);
        logger_1.default.info("OracleGovernor: hashProposal sucess!");
    }));
    // Add proposeCurrency subcommad
    oracleGovernorCmd
        .command("propose")
        .description("propose a new currency in the Oracle")
        .requiredOption("-s, --symbol <str>", "the symbol of proposal")
        .requiredOption("-u, --slug <str>", "the slug of proposal")
        .requiredOption("-r, --sources <array>", "the sources of proposal, splited by ','")
        .requiredOption("-t, --clientType <str>", "the clientType of proposal")
        .requiredOption("-l, --leasePeriod <str>", "the leasePeriod of proposal")
        .requiredOption("-x, --externalStorageHash <str>", "the externalStorageHash of proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: proposeCurrency started, configPath: %o,", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield proposeCurrency(account, token, oracleGovernor, options.symbol, options.slug, String(options.sources)
            .split(",")
            .map((s) => {
            return Number(s);
        }), options.clientType, options.leasePeriod, options.externalStorageHash, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: proposeCurrency sucess!");
    }));
    // Add execute subcommad
    oracleGovernorCmd
        .command("execute")
        .description("execute the proposal by the proposal id")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: execute started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield execute(account, token, oracleGovernor, options.proposalId, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: execute sucess!");
    }));
    // Add cancel subcommad
    oracleGovernorCmd
        .command("cancel")
        .description("cancel the proposal by the proposal id")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: cancel started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield cancel(account, token, oracleGovernor, options.proposalId, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: cancel sucess!");
    }));
    // Add hasVoted subcommad
    oracleGovernorCmd
        .command("hasVoted")
        .description("check whether votes have been cast")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: hasVoted started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield hasVoted(account, token, oracleGovernor, options.proposalId);
        logger_1.default.info("OracleGovernor: hasVoted sucess!");
    }));
    // Add castVote subcommad
    oracleGovernorCmd
        .command("castVote")
        .description("cast vote by proposalId")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .requiredOption("-t, --type <number>", "the type of the vote")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: castVote started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield castVote(account, token, oracleGovernor, options.proposalId, options.type, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: castVote sucess!");
    }));
    // Add castVoteWithReason subcommad
    oracleGovernorCmd
        .command("castVoteWithReason")
        .description("cast vote by proposalId with specific reason")
        .requiredOption("-i, --proposalId <id>", "the id of the proposal")
        .requiredOption("-t, --type <type>", "the type of the vote")
        .requiredOption("-r, --reason <str>", "the reason of the vote")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: castVoteWithReason started, configPath: %o", oracleGovernorCmd.opts().configPath);
        const [account, token, oracleGovernor, config] = yield parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
        yield castVoteWithReason(account, token, oracleGovernor, options.proposalId, options.type, options.reason);
        logger_1.default.info("OracleGovernor: castVoteWithReason sucess!");
    }));
    return oracleGovernorCmd;
}
exports.makeOracleGovernorCommand = makeOracleGovernorCommand;
//# sourceMappingURL=oracleGovernorHandler.js.map