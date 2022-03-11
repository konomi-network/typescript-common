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
exports.OToken = void 0;
const client_1 = require("./client");
class OToken extends client_1.Client {
    constructor(web3, abi, address, account, parameters) {
        super(web3, abi, address, account);
        this.underlyingDecimals = 18;
        this.parameters = parameters;
    }
    mint(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.mint(amount.toString());
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    redeem(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.redeem(amount.toString());
            let failed = null;
            yield this.send(method, yield this.prepareTxn(method), options, (receipt) => {
                failed = this.detectFailedEvents(receipt.events);
            });
            if (failed != null) {
                throw new Error(failed);
            }
        });
    }
    borrowRatePerBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const borrowRate = yield this.contract.methods.borrowRatePerBlock().call();
            return BigInt(borrowRate / Math.pow(10, this.underlyingDecimals));
        });
    }
    borrow(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.borrow(amount.toString());
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    borrowBalanceCurrent(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.contract.methods.borrowBalanceCurrent(address).call();
        });
    }
    approve(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.approve(this.address, amount.toString());
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    repayBorrow(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.repayBorrow(amount.toString());
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    balanceOf(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const b = yield this.contract.methods.balanceOf(address).call();
            return BigInt(b);
        });
    }
    exchangeRate() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.exchangeRateCurrent().call();
        });
    }
    // public convertFromUnderlying(amount: BigInt): BigInt {
    // }
    detectFailedEvents(events) {
        Object.keys(events).forEach((key) => {
            if (key === "Failure") {
                const error = events.Failure["returnValues"];
                if (error.error != 0) {
                    return error.info;
                }
                else {
                    return null;
                }
            }
        });
    }
    /**
     * Total Borrows is the amount of underlying currently loaned out by the market,
     * and the amount upon which interest is accumulated to suppliers of the market.
     */
    totalBorrowsCurrent() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.totalBorrowsCurrent().call();
        });
    }
    /**
     * Total Supply is the number of tokens currently in circulation in this cToken market.
     * It is part of the EIP-20 interface of the cToken contract.
     */
    totalSupply() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.totalSupply().call();
        });
    }
    /**
     * Cash is the amount of underlying balance owned by this cToken contract.
     */
    getCash() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.getCash().call();
        });
    }
    /**
     * The total amount of reserves held in the market.
     */
    totalReserves() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.totalReserves().call();
        });
    }
    /**
     * The reserve factor defines the portion of borrower interest that is converted into reserves.
     */
    reserveFactorMantissa() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.reserveFactorMantissa().call();
        });
    }
}
exports.OToken = OToken;
//# sourceMappingURL=oToken.js.map