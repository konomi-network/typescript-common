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
exports.ERC20Token = void 0;
const client_1 = require("./client");
class ERC20Token extends client_1.Client {
    balanceOf(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const b = yield this.contract.methods.balanceOf(address).call();
            return BigInt(b);
        });
    }
}
exports.ERC20Token = ERC20Token;
//# sourceMappingURL=erc20Token.js.map