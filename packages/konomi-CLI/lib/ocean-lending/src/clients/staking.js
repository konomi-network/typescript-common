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
exports.StakingV1 = void 0;
const client_1 = require("./client");
/**
 * Staking V1 contract client.
 */
class StakingV1 extends client_1.Client {
    /**
     * Supply reward in to the contract. Only allowed by admin.
     * @param amount The amount to withdraw
     */
    supplyReward(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.supplyReward(amount);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Withdraw amount into the contract.
     * @notice If the staking has ended, use withdrawAll to withdraw deposit.
     * @param amount The amount to deposit
     */
    withdraw(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.withdraw(amount);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * withdrawAll deposit and reward of user stake into the contract.
     */
    withdrawAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.withdrawAll();
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Deposit amount into the contract.
     * @param amount The amount to deposit
     */
    deposit(amount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.deposit(amount);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Get the staking metadata of the account passed in.
     * Returns the total amount deposited and total rewards
     * of the user.
     * @param account The account to check
     */
    stakeOf(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const s = yield this.contract.methods.getUserStake(address).call();
            const depositedAmount = BigInt(s["0"]);
            const totalRewards = BigInt(s["1"]);
            return [depositedAmount, totalRewards];
        });
    }
}
exports.StakingV1 = StakingV1;
//# sourceMappingURL=staking.js.map