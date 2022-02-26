#! /usr/bin/env node
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
const commander_1 = require("commander");
const logger_1 = __importDefault(require("./logger"));
const oceanLendingHandler_1 = require("./oceanLendingHandler");
function makeOceanCommand() {
    // Add ocean subcommad
    const ocean = new commander_1.Command('ocean');
    ocean.description('execute ocean-lending command')
        .requiredOption('-c, --config-path <path>', 'ocean-lending configuration json path')
        .option('-o, --oToken <path>', 'ocean-lending oToken configuration json path', '../ocean-lending/config/oToken.json')
        .option('-e, --erc20 <path>', 'ocean-lending erc20 configuration json path', '../ocean-lending/config/erc20.json')
        .option('-m, --comptroller <path>', 'ocean-lending configuration comptroller json path', '../ocean-lending/config/comptroller.json')
        .option('-p, --priceOracle <path>', 'ocean-lending priceOracle configuration json path', '../ocean-lending/config/priceOracle.json');
    // Add enterMarkets subcommad
    ocean
        .command('enterMarkets')
        .description('enter Markets and check the balance')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('OceanLending: enterMarkets started, configPath: %o', ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, priceOracle] = yield (0, oceanLendingHandler_1.parseOceanLendingConfiguration)(ocean.opts());
        const markets = [config.oTokens.oKono.address];
        yield (0, oceanLendingHandler_1.enterMarkets)(account, markets, comptroller);
        logger_1.default.info('OceanLending: enterMarkets sucess!');
    }));
    // Add deposit subcommad
    ocean
        .command('deposit')
        .description('charge otoken deposit with ERC20Token')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('OceanLending: deposit started, configPath: %o, amount: %o ', ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, priceOracle] = yield (0, oceanLendingHandler_1.parseOceanLendingConfiguration)(ocean.opts());
        yield (0, oceanLendingHandler_1.deposit)(account, oToken, token, options.amount);
        logger_1.default.info('OceanLending: deposit sucess!');
    }));
    // Add redeem subcommad
    ocean
        .command('redeem')
        .description('redeem all minted oToken')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('OceanLending: redeem started, configPath: %o', ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, priceOracle] = yield (0, oceanLendingHandler_1.parseOceanLendingConfiguration)(ocean.opts());
        yield (0, oceanLendingHandler_1.redeem)(account, oToken, token);
        logger_1.default.info('OceanLending: redeem sucess!');
    }));
    // Add borrow subcommad
    ocean
        .command('borrow')
        .description('brrow otoken use KONO as collateral')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('OceanLending: borrow started, configPath: %o, amount: %o', ocean.opts().configPath, options.amount);
        const [account, oToken, token, comptroller, config, priceOracle] = yield (0, oceanLendingHandler_1.parseOceanLendingConfiguration)(ocean.opts());
        yield (0, oceanLendingHandler_1.borrow)(account, oToken, token, priceOracle, comptroller, options.amount);
        logger_1.default.info('OceanLending: borrow sucess!');
    }));
    // Add repay subcommad
    ocean
        .command('repay')
        .description('repay borrow balance')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('OceanLending: repay started, configPath: %o', ocean.opts().configPath);
        const [account, oToken, token, comptroller, config, priceOracle] = yield (0, oceanLendingHandler_1.parseOceanLendingConfiguration)(ocean.opts());
        yield (0, oceanLendingHandler_1.repay)(account, oToken, token, priceOracle);
        logger_1.default.info('OceanLending: repay sucess!');
    }));
    return ocean;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const konomi = new commander_1.Command('konomi');
        // Add nested ocean commands.
        konomi.addCommand(makeOceanCommand());
        konomi.parse(process.argv);
    });
}
main();
//# sourceMappingURL=konomi.js.map