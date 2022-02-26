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
exports.parseOceanLendingConfiguration = exports.redeem = exports.deposit = exports.repay = exports.borrow = exports.enterMarkets = void 0;
const web3_1 = __importDefault(require("web3"));
const erc20Token_1 = require("../../ocean-lending/src/erc20Token");
const oToken_1 = require("../../ocean-lending/src/oToken");
const comptroller_1 = require("../../ocean-lending/src/comptroller");
const utils_1 = require("../../ocean-lending/src/utils");
const priceOracle_1 = require("../../ocean-lending/src/priceOracle");
const logger_1 = __importDefault(require("./logger"));
const utils_2 = require("../../ocean-lending/src/utils");
function enterMarkets(account, markets, comptroller) {
    return __awaiter(this, void 0, void 0, function* () {
        yield comptroller.enterMarkets(markets, { confirmations: 3 });
        const liquidity = yield comptroller.getAccountLiquidity(account.address);
        logger_1.default.info('enterMarkets: You have %o of LIQUID assets (worth of USD) pooled in the protocol.', liquidity);
        const konoCollateralFactor = yield comptroller.markets(markets[0]);
        logger_1.default.info('enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol as oKONO.', konoCollateralFactor);
    });
}
exports.enterMarkets = enterMarkets;
function borrow(account, oToken, token, priceOracle, comptroller, underlyingToBorrow) {
    return __awaiter(this, void 0, void 0, function* () {
        const liquidity = yield comptroller.getAccountLiquidity(account.address);
        if (liquidity.valueOf() <= 0) {
            logger_1.default.error("You don't have any liquid assets pooled in the protocol.");
        }
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        const borrowBalanceBefore = yield oToken.borrowBalanceCurrent(account.address);
        const konoCollateralFactor = yield comptroller.markets(oToken.address);
        const exchangeRate = yield oToken.exchangeRate();
        const underlyingPrice = yield priceOracle.getUnderlyingPrice(oToken.address);
        if (oTokenBefore.valueOf() <= BigInt(0)) {
            logger_1.default.error("You don't have any KONO as collateral.");
        }
        logger_1.default.info('erc20Before: %o, oTokenBefore: %o, exchangeRate: %o, underlyingPrice: %o', erc20Before, oTokenBefore, exchangeRate / 1e28, underlyingPrice.toFixed(6));
        logger_1.default.warn('NEVER borrow near the maximum amount because your account will be instantly liquidated.');
        const underlyingDeposited = (Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals)) * exchangeRate;
        const underlyingBorrowable = (underlyingDeposited * konoCollateralFactor) / 100;
        const underlyingDecimals = 18;
        const toBorrowLiquid = (underlyingToBorrow * underlyingPrice * konoCollateralFactor) / 100;
        logger_1.default.info('Borrow balance currently is %o', borrowBalanceBefore / Math.pow(10, underlyingDecimals));
        if (borrowBalanceBefore > underlyingBorrowable) {
            logger_1.default.error("Borrow balance exceeded collateral factor.");
        }
        if (toBorrowLiquid >= liquidity) {
            logger_1.default.error("Borrowing amount exceed account liquid");
        }
        const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
        yield oToken.borrow(scaledUpBorrowAmount, { confirmations: 3 });
        const borrowBalanceAfter = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info('Borrow balance after is %o', borrowBalanceAfter / Math.pow(10, underlyingDecimals));
        yield oToken.approve(scaledUpBorrowAmount, { confirmations: 3 });
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
        if (erc20After <= erc20Before) {
            logger_1.default.error("invalid erc20 balance, expected: %o, actual: %o", erc20Before, erc20After);
        }
        if (oTokenAfter !== oTokenBefore) {
            logger_1.default.error('invalid borrow balance');
        }
    });
}
exports.borrow = borrow;
function repay(account, oToken, token, priceOracle) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        logger_1.default.info('erc20Before: %o, oTokenBefore: %o', erc20Before, oTokenBefore);
        const balance = yield oToken.borrowBalanceCurrent(account.address);
        logger_1.default.info('borrow balance to repay %o', balance / 1e18);
        if (balance <= 0) {
            logger_1.default.error('invalid borrow balance to repay, expected more than zero');
        }
        yield oToken.repayBorrow(BigInt(balance), { confirmations: 3 });
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
        if (erc20Before <= erc20After) {
            logger_1.default.error("invalid erc20 balance, erc20Before expected: %o to be bigger than actual erc20After: %o", erc20Before, erc20After);
        }
    });
}
exports.repay = repay;
function deposit(account, oToken, token, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        logger_1.default.info('erc20Before: %o, oTokenBefore: %o', erc20Before, oTokenBefore);
        const depositAmount = BigInt(1000) * utils_1.ONE_ETHER;
        yield oToken.mint(depositAmount, { confirmations: 3 });
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        logger_1.default.info('erc20After: %o, oTokenAfter: %o', erc20After, oTokenAfter);
        const expectedErc = erc20Before.valueOf() - depositAmount;
        if (erc20After != expectedErc) {
            logger_1.default.error("invalid erc20 balance, expected erc20After: %o, actual: %o", expectedErc, erc20After);
        }
        if (oTokenAfter <= oTokenBefore) {
            logger_1.default.error('invalid borrow balance');
        }
    });
}
exports.deposit = deposit;
/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
function redeem(account, oToken, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const erc20Before = yield token.balanceOf(account.address);
        const oTokenBefore = yield oToken.balanceOf(account.address);
        logger_1.default.info('oToken minted: %o, oToken to redeem: %o', Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals), Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals));
        yield oToken.redeem(oTokenBefore, { confirmations: 3 });
        const erc20After = yield token.balanceOf(account.address);
        const oTokenAfter = yield oToken.balanceOf(account.address);
        if (erc20Before >= erc20After) {
            logger_1.default.error('invalid erc20 balance, expected erc20After: %o  to be bigger than erc20Before: %o', Number(erc20After) / 1e18, Number(erc20Before) / 1e18);
        }
        if (oTokenAfter.valueOf() !== BigInt(0)) {
            logger_1.default.error('invalid deposit balance');
        }
    });
}
exports.redeem = redeem;
/**
 * The OceanLeningHandler class for CLI's  OceanLending command .
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
            throw Error("Cannot setup account");
            logger_1.default.error('Cannot setup account');
        }
        logger_1.default.info('Using account: %o', account.address);
        // load the oToken object
        const oTokenAbi = (0, utils_2.readJsonSync)(options.oToken);
        const oToken = new oToken_1.OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);
        // load the erc20 token object
        const erc20Abi = (0, utils_2.readJsonSync)(options.erc20);
        const token = new erc20Token_1.ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);
        const comptrollerAbi = (0, utils_2.readJsonSync)(options.comptroller);
        const comptroller = new comptroller_1.Comptroller(web3, comptrollerAbi, oToken.parameters.comptroller, account);
        // load price feed object
        const priceOracleAbi = (0, utils_2.readJsonSync)(options.priceOracle);
        const priceOracle = new priceOracle_1.PriceOracle(web3, priceOracleAbi, config.priceOracle, account);
        return [account, oToken, token, comptroller, config, priceOracle];
    });
}
exports.parseOceanLendingConfiguration = parseOceanLendingConfiguration;
//# sourceMappingURL=oceanLendingHandler.js.map