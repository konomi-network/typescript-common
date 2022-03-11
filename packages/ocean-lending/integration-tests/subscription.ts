import Web3 from "web3";
import { Account } from "web3-core";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";
import { Subscription } from "../src/clients/subscription";

async function updateSubscriptionStatus(
  subscription: Subscription,
  subscriptionId: BigInt,
  suspended: boolean
) {
  console.log("==== updateSubscriptionStatus ====");
  await subscription.updateSubscriptionStatus(subscriptionId, suspended, {
    confirmations: 3,
  });
  console.log("==== updateSubscriptionStatus ====");
}

async function newSubscription(
  subscription: Subscription,
  externalStorageHash: string,
  sourceCount: BigInt,
  leasePeriod: BigInt,
  clientType: number,
  onBehalfOf: string
) {
  console.log("==== newSubscription ====");
  const [subscriptionId, address] = await subscription.newSubscription(
    externalStorageHash,
    sourceCount,
    leasePeriod,
    clientType,
    onBehalfOf
  );
  console.log(
    `externalStorageHash: ${externalStorageHash}, sourceCount: ${sourceCount}, leasePeriod: ${leasePeriod}, clientType: ${clientType}, onBehalfOf: ${onBehalfOf}, subscriptionId: ${subscriptionId}, address:${address}`
  );
  console.log("==== newSubscription ====");
}

async function subscribeByExisting(
  subscription: Subscription,
  subscriptionId: BigInt,
  leasePeriod: BigInt
) {
  console.log("==== subscribeByExisting ====");
  await subscription.subscribeByExisting(subscriptionId, leasePeriod, {
    confirmations: 3,
  });
  console.log("==== subscribeByExisting ====");
}

async function extendSubscription(
  subscription: Subscription,
  subscriptionId: BigInt,
  extendPeriod: BigInt
) {
  console.log("==== extendSubscription ====");
  await subscription.extendSubscription(subscriptionId, extendPeriod, {
    confirmations: 3,
  });
  console.log("==== extendSubscription ====");
}

async function minLeasePeriod(subscription: Subscription) {
  console.log("==== minLeasePeriod ====");
  const minPeriod = await subscription.minLeasePeriod();
  console.log("minLeasePeriod: " + minPeriod);
  console.log("==== minLeasePeriod ====");
}

async function main() {
  const config = readJsonSync("./config/config.json");

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(
      config.encryptedAccountJson,
      pw,
      web3
    );
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error("Cannot setup account");
  }

  console.log("Using account:", account.address);

  // load the subscription object
  const subscriptionAbi = readJsonSync("./config/subscription.json");
  const subscription = new Subscription(
    web3,
    subscriptionAbi,
    config.subscription.address,
    account
  );

  // actual tests
  const subscriptionId = BigInt("5000");
  const externalStorageHash = "QmZKvL22nkVPZqBYaWUFZupfHGezUCHr18ZM9PJCuiPNwf";
  const sourceCount = BigInt(1);
  const clientType = 1;
  const leasePeriod = BigInt(2689570);
  const extendPeriod = BigInt(3689570);

  await minLeasePeriod(subscription);
  // await newSubscription(
  //   subscription,
  //   externalStorageHash,
  //   sourceCount,
  //   leasePeriod,
  //   clientType,
  //   account.address
  // );
  // await updateSubscriptionStatus(subscription, subscriptionId, true);
  // await subscribeByExisting(subscription, subscriptionId, leasePeriod);
  // await extendSubscription(subscription, subscriptionId, extendPeriod);
}

main();
