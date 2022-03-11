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
exports.JumpInterestV2 = void 0;
const client_1 = require("./client");
/**
 * JumpInterest V2 contract client.
 */
class JumpInterestV2 extends client_1.Client {
    constructor() {
        super(...arguments);
        this.decimals = 1e18;
    }
    /*
     * The multiplier of utilization rate that gives the slope of the interest rate.
     */
    multiplierPerBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const m = yield this.contract.methods.multiplierPerBlock().call();
            return BigInt(m);
        });
    }
    /**
     * The base interest rate which is the y-intercept when utilization rate is 0
     */
    baseRatePerBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const b = yield this.contract.methods.baseRatePerBlock().call();
            return BigInt(b);
        });
    }
    /**
     * The multiplierPerBlock after hitting a specified utilization point
     */
    jumpMultiplierPerBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const j = yield this.contract.methods.jumpMultiplierPerBlock().call();
            return BigInt(j);
        });
    }
    /**
     * The utilization point at which the jump multiplier is applied
     */
    kink() {
        return __awaiter(this, void 0, void 0, function* () {
            const k = yield this.contract.methods.kink().call();
            return BigInt(k);
        });
    }
    /**
     * Calculates the current borrow interest rate per block
     * @param oToken The ocean-lending client object
     * @return The borrow rate per block (as a percentage, and scaled by 1e18)
     */
    getBorrowRate(oToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const [cash, borrows, reserves] = yield Promise.all([
                oToken.getCash(),
                oToken.totalBorrowsCurrent(),
                oToken.totalReserves(),
            ]);
            const rate = yield this.contract.methods
                .getBorrowRate(cash, borrows, reserves)
                .call();
            return BigInt(rate);
        });
    }
    /**
     * Calculates the current supply interest rate per block
     * @param oToken The ocean-lending client object
     * @return The supply rate per block (as a percentage, and scaled by 1e18)
     */
    getSupplyRate(oToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const [cash, borrows, reserves, reserveFactorMantissa] = yield Promise.all([
                oToken.getCash(),
                oToken.totalBorrowsCurrent(),
                oToken.totalReserves(),
                oToken.reserveFactorMantissa(),
            ]);
            const rate = yield this.contract.methods
                .getSupplyRate(cash, borrows, reserves, reserveFactorMantissa)
                .call();
            return BigInt(rate);
        });
    }
    /**
     * Calculates the current borrow interest rate APY
     * @param oToken The ocean-lending client object
     * @param blockTime The number of seconds per block
     * @return The borrow rate per block (as a percentage, and scaled by 1e18)
     */
    getBorrowRateAPY(oToken, blockTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const rate = yield this.getBorrowRate(oToken);
            return this.blockToYear(rate, blockTime);
        });
    }
    /**
     * Calculates the current supply interest rate APY
     * @param oToken The ocean-lending client object
     * @param blockTime The number of seconds per block
     * @return The supply rate per block (as a percentage, and scaled by 1e18)
     */
    getSupplyRateAPY(oToken, blockTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const rate = yield this.getSupplyRate(oToken);
            return this.blockToYear(rate, blockTime);
        });
    }
    /**
     * Convert rate per block to rate APY
     *@param rate The rate per block
     *@param blockTime The number of seconds per block
     */
    blockToYear(rate, blockTime) {
        const secondsPerYear = 31536000;
        const APY = (Number(rate) * secondsPerYear) / blockTime;
        return BigInt(APY);
    }
}
exports.JumpInterestV2 = JumpInterestV2;
//# sourceMappingURL=jumpInterestV2.js.map