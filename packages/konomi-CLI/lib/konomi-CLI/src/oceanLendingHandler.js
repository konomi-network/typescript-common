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
exports.makeOceanLendingCommand = exports.parseOceanLendingConfiguration = exports.getSupplyRateAPY = exports.getBorrowRateAPY = exports.getSupplyRate = exports.getBorrowRate = exports.kink = exports.jumpMultiplierPerBlock = exports.baseRatePerBlock = exports.multiplierPerBlock = exports.closeFactor = exports.collateralFactor = exports.liquidationIncentive = exports.redeemAll = exports.redeem = exports.deposit = exports.repayAll = exports.repay = exports.borrow = exports.enterMarkets = void 0;
const web3_1 = __importDefault(require("web3"));
const commander_1 = require("commander");
const erc20Token_1 = require("../../ocean-lending/src/clients/erc20Token");
const oToken_1 = require("../../ocean-lending/src/clients/oToken");
const comptroller_1 = require("../../ocean-lending/src/clients/comptroller");
const jumpInterestV2_1 = require("../../ocean-lending/src/clients/jumpInterestV2");
const utils_1 = require("../../ocean-lending/src/utils");
const logger_1 = __importDefault(require("./logger"));
const utils_2 = require("../../ocean-lending/src/utils");
// Interfaces related to OToken
function enterMarkets(account, markets, comptroller, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        yield comptroller.enterMarkets(markets, confirmations);
        const liquidity = yield comptroller.getAccountLiquidity(account.address);
        logger_1.default.info("enterMarkets: You have %o of LIQUID assets (worth of USD) pooled in the protocol.", liquidity);
        const konoCollateralFactor = yield comptroller.markets(markets[0]);
        logger_1.default.info("enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol as oKONO.", konoCollateralFactor);
    });
}
exports.enterMarkets = enterMarkets;
function borrow(account, oToken, token, comptroller, underlyingToBorrow, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const liquidity = yield comptroller.getAccountLiquidity(account.address);
        if (liquidity.valueOf() <= 0) {
            logger_1.default.error("You don't have any liquid assets pooled in the protocol.");
        }
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        const borrowBalanceBefore = yield oToken.borrowBalanceCurrent(account.address);
        if (oTokenBefore.valueOf() <= BigInt(0)) {
            logger_1.default.error("You don't have any KONO as collateral.");
        }
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o", erc20Before, oTokenBefore, borrowBalanceBefore);
        logger_1.default.warn("NEVER borrow near the maximum amount because your account will be instantly liquidated.");
        const underlyingDecimals = 18;
        const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
        yield oToken.borrow(scaledUpBorrowAmount, confirmations);
        yield oToken.approve(scaledUpBorrowAmount, confirmations);
        const borrowBalanceAfter = yield oToken.borrowBalanceCurrent(account.address);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o", erc20After, oTokenAfter, borrowBalanceAfter);
    });
}
exports.borrow = borrow;
function repay(account, oToken, token, amount, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        const borrowBalanceBefore = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o", erc20Before, oTokenBefore, borrowBalanceBefore);
        if (borrowBalanceBefore <= 0) {
            logger_1.default.error("invalid borrow balance to repay, expected more than zero");
        }
        if (amount > borrowBalanceBefore) {
            logger_1.default.error("the repayment amount exceeds the borrow balance");
        }
        const repayAmount = BigInt(amount) * utils_1.ONE_ETHER;
        yield oToken.repayBorrow(BigInt(repayAmount), confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        const borrowBalanceAfter = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o", erc20After, oTokenAfter, borrowBalanceAfter);
    });
}
exports.repay = repay;
function repayAll(account, oToken, token, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        const borrowBalanceBefore = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o", erc20Before, oTokenBefore, borrowBalanceBefore);
        logger_1.default.info("total borrow balance to repay is: %o", borrowBalanceBefore);
        if (borrowBalanceBefore <= 0) {
            logger_1.default.error("invalid borrow balance to repay, expected more than zero");
        }
        yield oToken.repayBorrow(BigInt(borrowBalanceBefore), confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        const borrowBalanceAfter = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o", erc20After, oTokenAfter, borrowBalanceAfter);
    });
}
exports.repayAll = repayAll;
function deposit(account, oToken, token, amount, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o", erc20Before, oTokenBefore);
        const depositAmount = BigInt(amount) * utils_1.ONE_ETHER;
        yield oToken.mint(depositAmount, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
    });
}
exports.deposit = deposit;
function redeem(account, oToken, token, amount, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        const oTokenToRedeem = BigInt(amount) * BigInt(Math.pow(10, oToken.parameters.decimals));
        logger_1.default.info("erc20Before: %o, oToken minted: %o, oToken to redeem: %o", erc20Before, oTokenBefore, oTokenToRedeem);
        yield oToken.redeem(oTokenToRedeem, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
    });
}
exports.redeem = redeem;
function redeemAll(account, oToken, token, confirmations) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20Before: %o, oToken minted: %o, oToken to redeem: %o", erc20Before, oTokenBefore, oTokenBefore);
        yield oToken.redeem(oTokenBefore, confirmations);
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
    });
}
exports.redeemAll = redeemAll;
// Interfaces related to Comptroller
function liquidationIncentive(account, oToken, token, comptroller) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, incentive] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            comptroller.liquidationIncentive(),
        ]);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, liquidationIncentive: %o", erc20Before, oTokenBefore, incentive);
    });
}
exports.liquidationIncentive = liquidationIncentive;
function collateralFactor(account, oToken, token, comptroller) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, collateralFactor] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            comptroller.collateralFactor(account.address),
        ]);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, collateralFactor: %o%", erc20Before, oTokenBefore, collateralFactor);
    });
}
exports.collateralFactor = collateralFactor;
function closeFactor(account, oToken, token, comptroller) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, closeFactor] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            comptroller.closeFactor(account.address),
        ]);
        logger_1.default.info("erc20Before: %o, oTokenBefore: %o, closeFactor: %o%", erc20Before, oTokenBefore, closeFactor);
    });
}
exports.closeFactor = closeFactor;
// Interfaces related to JumpInterestV2
function multiplierPerBlock(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, multiplier] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.multiplierPerBlock(),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, multiplierPerBlock: %o", erc20Before, oTokenBefore, multiplier);
    });
}
exports.multiplierPerBlock = multiplierPerBlock;
function baseRatePerBlock(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, baseRate] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.baseRatePerBlock(),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, baseRatePerBlock: %o", erc20Before, oTokenBefore, baseRate);
    });
}
exports.baseRatePerBlock = baseRatePerBlock;
function jumpMultiplierPerBlock(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, jumpMultiplier] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.jumpMultiplierPerBlock(),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, jumpMultiplierPerBlock: %o", erc20Before, oTokenBefore, jumpMultiplier);
    });
}
exports.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
function kink(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, _kink] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.kink(),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, kink: %o", erc20Before, oTokenBefore, _kink);
    });
}
exports.kink = kink;
function getBorrowRate(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, borrowRate] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.getBorrowRate(oToken),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, borrowRate: %o", erc20Before, oTokenBefore, borrowRate);
    });
}
exports.getBorrowRate = getBorrowRate;
function getSupplyRate(account, oToken, token, jumpInterestV2) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, supplyRate] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.getSupplyRate(oToken),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, supplyRate: %o", erc20Before, oTokenBefore, supplyRate);
    });
}
exports.getSupplyRate = getSupplyRate;
function getBorrowRateAPY(account, oToken, token, jumpInterestV2, blockTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, borrowRateAPY] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.getBorrowRateAPY(oToken, blockTime),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, borrowRateAPY: %o", erc20Before, oTokenBefore, borrowRateAPY);
    });
}
exports.getBorrowRateAPY = getBorrowRateAPY;
function getSupplyRateAPY(account, oToken, token, jumpInterestV2, blockTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const [erc20Before, oTokenBefore, supplyRateAPY] = yield Promise.all([
            token.balanceOf(account.address),
            oToken.balanceOf(account.address),
            jumpInterestV2.getSupplyRateAPY(oToken, blockTime),
        ]);
        logger_1.default.info("erc20: %o, oToken: %o, supplyRateAPY: %o", erc20Before, oTokenBefore, supplyRateAPY);
    });
}
exports.getSupplyRateAPY = getSupplyRateAPY;
/**
 * parse OceanLending Configuration json file.
 */
function parseOceanLendingConfiguration(options) {
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
        const comptrollerAbi = (0, utils_2.readJsonSync)(options.comptroller);
        const comptroller = new comptroller_1.Comptroller(web3, comptrollerAbi, oToken.parameters.comptroller, account);
        // load JumpInterestV2 object
        const jumpInterestV2Abi = (0, utils_2.readJsonSync)(options.jumpInterestV2);
        const jumpInterestV2 = new jumpInterestV2_1.JumpInterestV2(web3, jumpInterestV2Abi, config.jumpInterestV2.address, account);
        return [account, oToken, token, comptroller, config, jumpInterestV2];
    });
}
exports.parseOceanLendingConfiguration = parseOceanLendingConfiguration;
function makeOceanLendingCommand() {
    // Add ocean subcommad
    const ocean = new commander_1.Command("ocean");
    ocean
        .description("execute ocean-lending command")
        .requiredOption("-c, --config-path <path>", "ocean-lending configuration json path")
        .option("-o, --oToken <path>", "ocean-lending oToken configuration json path", "../ocean-lending/config/oToken.json")
        .option("-e, --erc20 <path>", "ocean-lending erc20 configuration json path", "../ocean-lending/config/erc20.json")
        .option("-m, --comptroller <path>", "ocean-lending configuration comptroller json path", "../ocean-lending/config/comptroller.json")
        .option("-p, --priceOracle <path>", "ocean-lending priceOracle configuration json path", "../ocean-lending/config/priceOracle.json")
        .option("-j, --jumpInterestV2 <path>", "ocean-lending jumpInterestV2 configuration json path", "../ocean-lending/config/jumpInterestV2.json");
    // Add enterMarkets subcommad
    ocean
        .command("enterMarkets")
        .description("enter Markets and check the balance")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: enterMarkets started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        const markets = [config.oTokens.oKono.address];
        yield enterMarkets(account, markets, comptroller, config.clients.txnOptions);
        logger_1.default.info("OceanLending: enterMarkets sucess!");
    }));
    // Add deposit subcommad
    ocean
        .command("deposit")
        .description("charge otoken deposit with ERC20Token")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to deposit")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: deposit started, configPath: %o, amount: %o ", ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield deposit(account, oToken, token, options.amount, config.clients.txnOptions);
        logger_1.default.info("OceanLending: deposit sucess!");
    }));
    // Add redeem subcommad
    ocean
        .command("redeem")
        .description("redeem minted oToken")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to redeem")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: redeem started, configPath: %o, amount: %o", ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield redeem(account, oToken, token, options.amount, config.clients.txnOptions);
        logger_1.default.info("OceanLending: redeem sucess!");
    }));
    // Add redeemAll subcommad
    ocean
        .command("redeemAll")
        .description("redeem all minted oToken")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: redeemAll started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield redeemAll(account, oToken, token, config.clients.txnOptions);
        logger_1.default.info("OceanLending: redeemAll sucess!");
    }));
    // Add borrow subcommad
    ocean
        .command("borrow")
        .description("brrow otoken use KONO as collateral")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to borrow")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: borrow started, configPath: %o, amount: %o", ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield borrow(account, oToken, token, comptroller, options.amount, config.clients.txnOptions);
        logger_1.default.info("OceanLending: borrow sucess!");
    }));
    // Add repay subcommad
    ocean
        .command("repay")
        .description("repay borrow balance")
        .requiredOption("-a, --amount <amount>", "the amount of tokens to reapy")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: repay started, configPath: %o, amount: %o", ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield repay(account, oToken, token, options.amount, config.clients.txnOptions);
        logger_1.default.info("OceanLending: repay sucess!");
    }));
    // Add repayAll subcommad
    ocean
        .command("repayAll")
        .description("repay all borrow balance")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: repayAll started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield repayAll(account, oToken, token, config.clients.txnOptions);
        logger_1.default.info("OceanLending: repayAll sucess!");
    }));
    // Add liquidationIncentive subcommad
    ocean
        .command("incentive")
        .description("incentive to perform liquidation of underwater accounts")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: liquidationIncentive started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield liquidationIncentive(account, oToken, token, comptroller);
        logger_1.default.info("OceanLending: liquidationIncentive sucess!");
    }));
    // Add collateralFactor subcommad
    ocean
        .command("collateralFactor")
        .description("oToken's collateral factor, range from 0-90%")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: collateralFactor started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield collateralFactor(account, oToken, token, comptroller);
        logger_1.default.info("OceanLending: collateralFactor sucess!");
    }));
    // Add closeFactor subcommad
    ocean
        .command("closeFactor")
        .description("oToken's close factor, range from 0-100%")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: closeFactor started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield closeFactor(account, oToken, token, comptroller);
        logger_1.default.info("OceanLending: closeFactor sucess!");
    }));
    // Add multiplierPerBlock subcommad
    ocean
        .command("multiplier")
        .description("the multiplier of utilization rate that gives the slope of the interest rate.")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: multiplierPerBlock started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield multiplierPerBlock(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: multiplierPerBlock sucess!");
    }));
    // Add baseRatePerBlock subcommad
    ocean
        .command("baseRate")
        .description("the base interest rate which is the y-intercept when utilization rate is 0")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: baseRatePerBlock started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield baseRatePerBlock(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: baseRatePerBlock sucess!");
    }));
    // Add jumpMultiplierPerBlock subcommad
    ocean
        .command("jumpMultiplier")
        .description("the multiplierPerBlock after hitting a specified utilization point")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: jumpMultiplierPerBlock started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield jumpMultiplierPerBlock(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: jumpMultiplierPerBlock sucess!");
    }));
    // Add kink subcommad
    ocean
        .command("kink")
        .description("the utilization point at which the jump multiplier is applied")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: kink started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield kink(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: kink sucess!");
    }));
    // Add getBorrowRate subcommad
    ocean
        .command("borrowRate")
        .description("the current borrow interest rate per block")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: getBorrowRate started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield getBorrowRate(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: getBorrowRate sucess!");
    }));
    // Add getSupplyRate subcommad
    ocean
        .command("supplyRate")
        .description("the current supply interest rate per block")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: getSupplyRate started, configPath: %o", ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield getSupplyRate(account, oToken, token, jumpInterestV2);
        logger_1.default.info("OceanLending: getSupplyRate sucess!");
    }));
    // Add getBorrowRateAPY subcommad
    ocean
        .command("borrowRateAPY")
        .description("the current borrow interest rate APY")
        .requiredOption("-t, --blockTime <time>", "the number of seconds per block")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: getBorrowRateAPY started, configPath: %o, blockTime: %o", ocean.opts().configPath, options.blockTime);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield getBorrowRateAPY(account, oToken, token, jumpInterestV2, options.blockTime);
        logger_1.default.info("OceanLending: getBorrowRate sucess!");
    }));
    // Add getSupplyRateAPY subcommad
    ocean
        .command("supplyRateAPY")
        .description("the current supply interest rate APY")
        .requiredOption("-t, --blockTime <time>", "the number of seconds per block")
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("OceanLending: getSupplyRateAPY started, configPath: %o, blockTime: %o", ocean.opts().configPath, options.blockTime);
        const [account, oToken, token, comptroller, config, jumpInterestV2] = yield parseOceanLendingConfiguration(ocean.opts());
        yield getSupplyRateAPY(account, oToken, token, jumpInterestV2, options.blockTime);
        logger_1.default.info("OceanLending: getSupplyRateAPY sucess!");
    }));
    return ocean;
}
exports.makeOceanLendingCommand = makeOceanLendingCommand;
//# sourceMappingURL=oceanLendingHandler.js.map