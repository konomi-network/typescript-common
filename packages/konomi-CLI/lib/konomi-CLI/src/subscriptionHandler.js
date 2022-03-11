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
exports.makeSubscriptionCommand = exports.parseOracleSubscriptionConfiguration = exports.updateSubscriptionStatus = exports.minLeasePeriod = void 0;
const web3_1 = __importDefault(require("web3"));
const commander_1 = require("commander");
const erc20Token_1 = require("../../ocean-lending/src/clients/erc20Token");
const oToken_1 = require("../../ocean-lending/src/clients/oToken");
const Subscription_1 = require("../../ocean-lending/src/clients/Subscription");
const logger_1 = __importDefault(require("./logger"));
const utils_1 = require("../../ocean-lending/src/utils");
function minLeasePeriod(account, token, subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, leasePeriod] = yield Promise.all([
            token.balanceOf(account.address),
            subscription.minLeasePeriod(),
        ]);
        logger_1.default.info("erc20: %o:, minLeasePeriod: %o", erc20Before, leasePeriod);
    });
}
exports.minLeasePeriod = minLeasePeriod;
function updateSubscriptionStatus(account, token, subscription, subscriptionId, suspended, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        yield subscription.updateSubscriptionStatus(subscriptionId, suspended, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, erc20After: %o, subscriptionId: %o, suspended: %o", erc20Before, erc20After, subscriptionId, suspended);
    });
}
exports.updateSubscriptionStatus = updateSubscriptionStatus;
function newSubscription(account, token, subscription, externalStorageHash, sourceCount, leasePeriod, clientType, onBehalfOf) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const [subscriptionId, feedContract] = yield subscription.newSubscription(externalStorageHash, sourceCount, leasePeriod, clientType, onBehalfOf);
        const erc20After = yield token.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, erc20After: %o, externalStorageHash: %o, sourceCount: %o, leasePeriod: %o, clientType: %o, onBehalfOf: %o, subscriptionId: %o", erc20Before, erc20After, externalStorageHash, sourceCount, leasePeriod, clientType, onBehalfOf, subscriptionId);
    });
}
function subscribeByExisting(account, token, subscription, subscriptionId, leasePeriod, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        yield subscription.subscribeByExisting(subscriptionId, leasePeriod, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, erc20After: %o, subscriptionId: %o, leasePeriod: %o", erc20Before, erc20After, subscriptionId, leasePeriod);
    });
}
function extendSubscription(account, token, subscription, subscriptionId, extendPeriod, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        yield subscription.extendSubscription(subscriptionId, extendPeriod, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, erc20After: %o, subscriptionId: %o, extendPeriod: %o", erc20Before, erc20After, subscriptionId, extendPeriod);
    });
}
/**
 * Parse Subscription Configuration json file.
 */
function parseOracleSubscriptionConfiguration(options) {
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
        // load the subscription object
        const subscriptionAbi = (0, utils_1.readJsonSync)(options.subscription);
        const subscription = new Subscription_1.Subscription(web3, subscriptionAbi, config.subscription.address, account);
        return [account, token, subscription, config];
    });
}
exports.parseOracleSubscriptionConfiguration = parseOracleSubscriptionConfiguration;
function makeSubscriptionCommand() {
    // Add subscription subcommad
    const subscriptionCmd = new commander_1.Command("subscription");
    subscriptionCmd
        .description("execute subscription command")
        .requiredOption("-c, --config-path <path>", "configuration json path")
        .option("-o, --oToken <path>", "subscription oToken configuration json path", "../ocean-lending/config/oToken.json")
        .option("-e, --erc20 <path>", "subscription erc20 configuration json path", "../ocean-lending/config/erc20.json")
        .option("-s, --subscription <path>", "subscription configuration json path", "../ocean-lending/config/subscription.json");
    // Add minLeasePeriod subcommad
    subscriptionCmd
        .command("minLeasePeriod")
        .description("minimal lease period required to make a new subscription")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: minLeasePeriod started, configPath: %o", subscriptionCmd.opts().configPath);
        const [account, token, suscription] = yield parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
        yield minLeasePeriod(account, token, suscription);
        logger_1.default.info("OracleGovernor: minLeasePeriod sucess!");
    }));
    // Add updateSubscriptionStatus subcommad
    subscriptionCmd
        .command("update")
        .description("update the subscription status by Id. Either suspend the subscription or enable the subscription")
        .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
        .requiredOption("-u, --suspended <boolean>", "whether to suspend the subscription, either suspend or enable")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: updateSubscriptionStatus started, configPath: %o", subscriptionCmd.opts().configPath);
        const [account, token, subscription, config] = yield parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
        yield updateSubscriptionStatus(account, token, subscription, options.subscriptionId, options.suspended, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: updateSubscriptionStatus sucess!");
    }));
    // Add newSubscription subcommad
    subscriptionCmd
        .command("new")
        .description("make the subscription with brand new data, this should be invoked by whitelisted address only")
        .requiredOption("-x, --externalStorageHash <str>", "the external storage hash of subscription")
        .requiredOption("-r, --sourceCount <number>", "the source count of subscription")
        .requiredOption("-l, --leasePeriod <number>", "the leasePeriod of subscription")
        .requiredOption("-t, --clientType <number>", "the client type of subscription")
        .requiredOption("-n, --onBehalfOf <address>", "making the subscription on behalf of address")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: updateSubscriptionStatus started, configPath: %o", subscriptionCmd.opts().configPath);
        const [account, token, subscription, config] = yield parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
        yield newSubscription(account, token, subscription, options.externalStorageHash, options.sourceCount, options.leasePeriod, options.clientType, options.onBehalfOf);
        logger_1.default.info("OracleGovernor: updateSubscriptionStatus sucess!");
    }));
    // Add subscribeByExisting subcommad
    subscriptionCmd
        .command("subscribe")
        .description("make the subscription by existing live subscriptions")
        .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
        .requiredOption("-l, --leasePeriod <number>", "the lease period of subscription")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: subscribeByExisting started, configPath: %o", subscriptionCmd.opts().configPath);
        const [account, token, subscription, config] = yield parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
        yield subscribeByExisting(account, token, subscription, options.subscriptionId, options.leasePeriod, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: subscribeByExisting sucess!");
    }));
    // Add extendSubscription subcommad
    subscriptionCmd
        .command("extend")
        .description("extend the subscription identified by on chain subscription id")
        .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
        .requiredOption("-l, --extendPeriod <number>", "the period to extend the subscription")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OracleGovernor: extendSubscription started, configPath: %o", subscriptionCmd.opts().configPath);
        const [account, token, subscription, config] = yield parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
        yield extendSubscription(account, token, subscription, options.subscriptionId, options.extendPeriod, config.clients.txnOptions);
        logger_1.default.info("OracleGovernor: extendSubscription sucess!");
    }));
    return subscriptionCmd;
}
exports.makeSubscriptionCommand = makeSubscriptionCommand;
//# sourceMappingURL=subscriptionHandler.js.map