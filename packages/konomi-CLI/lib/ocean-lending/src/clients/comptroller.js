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
exports.Comptroller = void 0;
const client_1 = require("./client");
class Comptroller extends client_1.Client {
    constructor() {
        super(...arguments);
        this.decimals = 1e18;
    }
    enterMarkets(markets, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.enterMarkets(markets);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    getAccountLiquidity(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { 1: liquidity } = yield this.contract.methods
                .getAccountLiquidity(address)
                .call();
            return liquidity / this.decimals;
        });
    }
    markets(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { 1: collateralFactor } = yield this.contract.methods
                .markets(address)
                .call();
            return (collateralFactor / this.decimals) * 100;
        });
    }
    /*
     * The additional collateral given to liquidators as an incentive to perform liquidation of underwater accounts.
     * For example, if the liquidation incentive is 1.1, liquidators receive an extra 10% of the borrowers collateral for every unit they close.
     */
    liquidationIncentive() {
        return __awaiter(this, void 0, void 0, function* () {
            const incentive = yield this.contract.methods
                .liquidationIncentiveMantissa()
                .call();
            return BigInt(incentive);
        });
    }
    /**
     * A cToken's collateral factor can range from 0-90%
     * represents the proportionate increase in liquidity that an account receives by minting the cToken
     */
    collateralFactor(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { 1: factor } = yield this.contract.methods.markets(address).call();
            return (factor / this.decimals) * 100;
        });
    }
    /**
     * The percent, ranging from 0% to 100%, of a liquidatable account's borrow that can be repaid in a single liquidate transaction.
     */
    closeFactor(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const factor = yield this.contract.methods.closeFactorMantissa().call();
            return (factor / this.decimals) * 100;
        });
    }
}
exports.Comptroller = Comptroller;
//# sourceMappingURL=comptroller.js.map