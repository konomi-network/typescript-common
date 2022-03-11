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
exports.makeStakingCommand = exports.parseStakingConfiguration = exports.withdrawAll = exports.withdraw = exports.deposit = exports.stakeOf = void 0;
const web3_1 = __importDefault(require("web3"));
const commander_1 = require("commander");
const erc20Token_1 = require("../../ocean-lending/src/clients/erc20Token");
const oToken_1 = require("../../ocean-lending/src/clients/oToken");
const utils_1 = require("../../ocean-lending/src/utils");
const staking_1 = require("../../ocean-lending/src/clients/staking");
const logger_1 = __importDefault(require("./logger"));
const utils_2 = require("../../ocean-lending/src/utils");
function stakeOf(account, token, stakingV1) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const [depositedAmount, totalReward] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20: %o, depositedAmountBefore: %o, totalRewardsBefore: %o", erc20Before, depositedAmount, totalReward);
    });
}
exports.stakeOf = stakeOf;
function deposit(account, token, stakingV1, amount, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const [depositedAmountBefore, totalRewardsBefore] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o", erc20Before, depositedAmountBefore, totalRewardsBefore);
        const depositAmount = BigInt(amount) * utils_1.ONE_ETHER;
        yield stakingV1.deposit(depositAmount.toString(), confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const [depositedAmountAfter, totalRewardsAfter] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o", erc20After, depositedAmountAfter, totalRewardsAfter);
    });
}
exports.deposit = deposit;
function withdraw(account, token, stakingV1, amount, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const [depositedAmountBefore, totalRewardsBefore] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o", erc20Before, depositedAmountBefore, totalRewardsBefore);
        const withdrawAmount = BigInt(amount) * utils_1.ONE_ETHER;
        yield stakingV1.withdraw(withdrawAmount.toString(), confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const [depositedAmountAfter, totalRewardsAfter] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o", erc20After, depositedAmountAfter, totalRewardsAfter);
    });
}
exports.withdraw = withdraw;
function withdrawAll(account, token, stakingV1, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const [depositedAmountBefore, totalRewardsBefore] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o", erc20Before, depositedAmountBefore, totalRewardsBefore);
        yield stakingV1.withdrawAll(confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const [depositedAmountAfter, totalRewardsAfter] = yield stakingV1.stakeOf(account.address);
        logger_1.default.info("erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o", erc20After, depositedAmountAfter, totalRewardsAfter);
    });
}
exports.withdrawAll = withdrawAll;
/**
 * Parse staking configuration json file.
 */
function parseStakingConfiguration(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = (0, utils_2.readJsonSync)(options.configPath);
        const web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(config.nodeUrl));
        let account;
        if (config.encryptedAccountJson) {
            const pw = yield (0, utils_2.readPassword)();
            account = (0, utils_2.loadWalletFromEncyrptedJson)(config.encryptedAccountJson, pw, web3);
        }
        else if (config.privateKey) {
            account = (0, utils_2.loadWalletFromPrivate)(config.privateKey, web3);
        }
        else {
            logger_1.default.error("Cannot setup account");
            throw Error("Cannot setup account");
        }
        logger_1.default.info("Using account: %o", account.address);
        // load the oToken object
        const oTokenAbi = (0, utils_2.readJsonSync)(options.oToken);
        const oToken = new oToken_1.OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);
        // load the erc20 token object
        const erc20Abi = (0, utils_2.readJsonSync)(options.erc20);
        const token = new erc20Token_1.ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);
        // load the stakingV1 object
        const stakingV1Abi = (0, utils_2.readJsonSync)(options.stakingV1);
        const stakingV1 = new staking_1.StakingV1(web3, stakingV1Abi, config.stakingV1.address, account);
        return [account, token, stakingV1, config];
    });
}
exports.parseStakingConfiguration = parseStakingConfiguration;
function makeStakingCommand() {
    // Add staking subcommad
    const staking = new commander_1.Command("staking");
    staking
        .description("execute staking command")
        .requiredOption("-c, --config-path <path>", "staking configuration json path")
        .option("-o, --oToken <path>", "staking oToken configuration json path", "../ocean-lending/config/oToken.json")
        .option("-e, --erc20 <path>", "staking erc20 configuration json path", "../ocean-lending/config/erc20.json")
        .option("-s, --stakingV1 <path>", "staking configuration json path", "../ocean-lending/config/stakingV1.json");
    // Add stakes subcommad
    staking
        .command("stakes")
        .description("check the total amount deposited and total rewards")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("Staking: stakes started, configPath: %o", staking.opts().configPath);
        const [account, token, stakingV1, config] = yield parseStakingConfiguration(staking.opts());
        yield stakeOf(account, token, stakingV1);
        logger_1.default.info("Staking: stakes sucess!");
    }));
    // Add deposit subcommad
    staking
        .command("deposit")
        .description("deposit amount into the staking contract")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to deposit")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("Staking: deposit started, configPath: %o, amount: %o ", staking.opts().configPath, options.amount);
        const [account, token, stakingV1, config] = yield parseStakingConfiguration(staking.opts());
        yield deposit(account, token, stakingV1, options.amount, config.clients.txnOptions);
        logger_1.default.info("Staking: deposit sucess!");
    }));
    // Add withdraw subcommad
    staking
        .command("withdraw")
        .description("withdraw amount into the contract.")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to withdraw")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("Staking: withdraw started, configPath: %o, amount: %o", staking.opts().configPath, options.amount);
        const [account, token, stakingV1, config] = yield parseStakingConfiguration(staking.opts());
        yield withdraw(account, token, stakingV1, options.amount, config.clients.txnOptions);
        logger_1.default.info("Staking: withdraw sucess!");
    }));
    // Add withdrawAll subcommad
    staking
        .command("withdrawAll")
        .description("withdraw all deposit and reward of user stake into the contract.")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("Staking: withdrawAll started, configPath: %o", staking.opts().configPath);
        const [account, token, stakingV1, config] = yield parseStakingConfiguration(staking.opts());
        yield withdrawAll(account, token, stakingV1, config.clients.txnOptions);
        logger_1.default.info("Staking: withdrawAll sucess!");
    }));
    return staking;
}
exports.makeStakingCommand = makeStakingCommand;
//# sourceMappingURL=stakingHandler.js.map