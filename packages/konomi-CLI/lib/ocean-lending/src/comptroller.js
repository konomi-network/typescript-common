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
            const { 1: liquidity } = yield this.contract.methods.getAccountLiquidity(address).call();
            return liquidity / this.decimals;
        });
    }
    markets(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { 1: collateralFactor } = yield this.contract.methods.markets(address).call();
            return (collateralFactor / this.decimals) * 100;
        });
    }
}
exports.Comptroller = Comptroller;
//# sourceMappingURL=comptroller.js.map