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
exports.Subscription = void 0;
const client_1 = require("./client");
/**
 * Subscription contract client.
 */
class Subscription extends client_1.Client {
    /**
     * Update the subscription status. Either suspend the subscription or enable the subscription.
     * @param subscriptionId The subscription id
     * @param suspended Whether to suspend the subscription
     */
    updateSubscriptionStatus(subscriptionId, suspended, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.updateSubscriptionStatus(subscriptionId, suspended);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Make the subscription with brand new data. This should be invoked by whitelisted address only.
     * @param externalStorageHash The external storage hash
     * @param sourceCount The number of data sources count
     * @param leasePeriod The lease period of the subscription
     * @param clientType  The client type of the subscription
     * @param onBehalfOf Making the subscription on behalf of address
     */
    newSubscription(externalStorageHash, sourceCount, leasePeriod, clientType, onBehalfOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const [subscriptionId, feedContract] = yield this.contract.methods
                .newSubscription(externalStorageHash, sourceCount, leasePeriod, clientType, onBehalfOf)
                .call();
            return [subscriptionId, feedContract];
        });
    }
    /**
     * Make the subscription by existing live subscriptions
     * @param subscriptionId The id of the subscription to follow
     * @param leasePeriod The lease period of the subscription
     */
    subscribeByExisting(subscriptionId, leasePeriod, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.subscribeByExisting(subscriptionId, leasePeriod);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Extend the subscription identified by on chain subscription id
     * @param subscriptionId The id of the subscription to follow
     * @param extendPeriod The period to extend the subscription
     */
    extendSubscription(subscriptionId, extendPeriod, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = this.contract.methods.extendSubscription(subscriptionId, extendPeriod);
            yield this.send(method, yield this.prepareTxn(method), options);
        });
    }
    /**
     * Returns the minimal lease period required to make a new subscription
     */
    minLeasePeriod() {
        return __awaiter(this, void 0, void 0, function* () {
            const leasePeriod = yield this.contract.methods.minLeasePeriod().call();
            return BigInt(leasePeriod);
        });
    }
}
exports.Subscription = Subscription;
//# sourceMappingURL=Subscription.js.map