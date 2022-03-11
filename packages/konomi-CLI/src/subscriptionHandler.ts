import Web3 from "web3";
import { Command, OptionValues } from "commander";
import { Account } from "web3-core";
import { ERC20Token } from "../../ocean-lending/src/clients/erc20Token";
import { OToken } from "../../ocean-lending/src/clients/oToken";
import { Subscription } from "../../ocean-lending/src/clients/Subscription";
import logger from "./logger";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../../ocean-lending/src/utils";
import { TxnOptions } from "../../ocean-lending/src/options";

export async function minLeasePeriod(
  account: Account,
  token: ERC20Token,
  subscription: Subscription
) {
  const [erc20Before, leasePeriod] = await Promise.all([
    token.balanceOf(account.address),
    subscription.minLeasePeriod(),
  ]);
  logger.info("erc20: %o:, minLeasePeriod: %o", erc20Before, leasePeriod);
}

export async function updateSubscriptionStatus(
  account: Account,
  token: ERC20Token,
  subscription: Subscription,
  subscriptionId: BigInt,
  suspended: boolean,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);

  await subscription.updateSubscriptionStatus(
    subscriptionId,
    suspended,
    confirmations
  );

  const erc20After = await token.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, erc20After: %o, subscriptionId: %o, suspended: %o",
    erc20Before,
    erc20After,
    subscriptionId,
    suspended
  );
}

async function newSubscription(
  account: Account,
  token: ERC20Token,
  subscription: Subscription,
  externalStorageHash: string,
  sourceCount: BigInt,
  leasePeriod: BigInt,
  clientType: number,
  onBehalfOf: string
) {
  const erc20Before = await token.balanceOf(account.address);

  const [subscriptionId, feedContract] = await subscription.newSubscription(
    externalStorageHash,
    sourceCount,
    leasePeriod,
    clientType,
    onBehalfOf
  );

  const erc20After = await token.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, erc20After: %o, externalStorageHash: %o, sourceCount: %o, leasePeriod: %o, clientType: %o, onBehalfOf: %o, subscriptionId: %o",
    erc20Before,
    erc20After,
    externalStorageHash,
    sourceCount,
    leasePeriod,
    clientType,
    onBehalfOf,
    subscriptionId
  );
}

async function subscribeByExisting(
  account: Account,
  token: ERC20Token,
  subscription: Subscription,
  subscriptionId: BigInt,
  leasePeriod: BigInt,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);

  await subscription.subscribeByExisting(
    subscriptionId,
    leasePeriod,
    confirmations
  );

  const erc20After = await token.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, erc20After: %o, subscriptionId: %o, leasePeriod: %o",
    erc20Before,
    erc20After,
    subscriptionId,
    leasePeriod
  );
}

async function extendSubscription(
  account: Account,
  token: ERC20Token,
  subscription: Subscription,
  subscriptionId: BigInt,
  extendPeriod: BigInt,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);

  await subscription.extendSubscription(
    subscriptionId,
    extendPeriod,
    confirmations
  );

  const erc20After = await token.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, erc20After: %o, subscriptionId: %o, extendPeriod: %o",
    erc20Before,
    erc20After,
    subscriptionId,
    extendPeriod
  );
}

/**
 * Parse Subscription Configuration json file.
 */
export async function parseOracleSubscriptionConfiguration(
  options: OptionValues
) {
  const config = readJsonSync(options.configPath);

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
    logger.error("Cannot setup account");
    throw Error("Cannot setup account");
  }

  logger.info("Using account: %o", account.address);

  // load the oToken object
  const oTokenAbi = readJsonSync(options.oToken);
  const oToken = new OToken(
    web3,
    oTokenAbi,
    config.oTokens.oKono.address,
    account,
    config.oTokens.oKono.parameters
  );

  // load the erc20 token object
  const erc20Abi = readJsonSync(options.erc20);
  const token = new ERC20Token(
    web3,
    erc20Abi,
    oToken.parameters.underlying,
    account
  );

  // load the subscription object
  const subscriptionAbi = readJsonSync(options.subscription);
  const subscription = new Subscription(
    web3,
    subscriptionAbi,
    config.subscription.address,
    account
  );

  return [account, token, subscription, config] as const;
}

export function makeSubscriptionCommand(): Command {
  // Add subscription subcommad
  const subscriptionCmd = new Command("subscription");
  subscriptionCmd
    .description("execute subscription command")
    .requiredOption("-c, --config-path <path>", "configuration json path")
    .option(
      "-o, --oToken <path>",
      "subscription oToken configuration json path",
      "../ocean-lending/config/oToken.json"
    )
    .option(
      "-e, --erc20 <path>",
      "subscription erc20 configuration json path",
      "../ocean-lending/config/erc20.json"
    )
    .option(
      "-s, --subscription <path>",
      "subscription configuration json path",
      "../ocean-lending/config/subscription.json"
    );

  // Add minLeasePeriod subcommad
  subscriptionCmd
    .command("minLeasePeriod")
    .description("minimal lease period required to make a new subscription")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: minLeasePeriod started, configPath: %o",
        subscriptionCmd.opts().configPath
      );
      const [account, token, suscription] =
        await parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
      await minLeasePeriod(account, token, suscription);
      logger.info("OracleGovernor: minLeasePeriod sucess!");
    });

  // Add updateSubscriptionStatus subcommad
  subscriptionCmd
    .command("update")
    .description(
      "update the subscription status by Id. Either suspend the subscription or enable the subscription"
    )
    .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
    .requiredOption(
      "-u, --suspended <boolean>",
      "whether to suspend the subscription, either suspend or enable"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: updateSubscriptionStatus started, configPath: %o",
        subscriptionCmd.opts().configPath
      );
      const [account, token, subscription, config] =
        await parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
      await updateSubscriptionStatus(
        account,
        token,
        subscription,
        options.subscriptionId,
        options.suspended,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: updateSubscriptionStatus sucess!");
    });

  // Add newSubscription subcommad
  subscriptionCmd
    .command("new")
    .description(
      "make the subscription with brand new data, this should be invoked by whitelisted address only"
    )
    .requiredOption(
      "-x, --externalStorageHash <str>",
      "the external storage hash of subscription"
    )
    .requiredOption(
      "-r, --sourceCount <number>",
      "the source count of subscription"
    )
    .requiredOption(
      "-l, --leasePeriod <number>",
      "the leasePeriod of subscription"
    )
    .requiredOption(
      "-t, --clientType <number>",
      "the client type of subscription"
    )
    .requiredOption(
      "-n, --onBehalfOf <address>",
      "making the subscription on behalf of address"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: updateSubscriptionStatus started, configPath: %o",
        subscriptionCmd.opts().configPath
      );
      const [account, token, subscription, config] =
        await parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
      await newSubscription(
        account,
        token,
        subscription,
        options.externalStorageHash,
        options.sourceCount,
        options.leasePeriod,
        options.clientType,
        options.onBehalfOf
      );
      logger.info("OracleGovernor: updateSubscriptionStatus sucess!");
    });

  // Add subscribeByExisting subcommad
  subscriptionCmd
    .command("subscribe")
    .description("make the subscription by existing live subscriptions")
    .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
    .requiredOption(
      "-l, --leasePeriod <number>",
      "the lease period of subscription"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: subscribeByExisting started, configPath: %o",
        subscriptionCmd.opts().configPath
      );
      const [account, token, subscription, config] =
        await parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
      await subscribeByExisting(
        account,
        token,
        subscription,
        options.subscriptionId,
        options.leasePeriod,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: subscribeByExisting sucess!");
    });

  // Add extendSubscription subcommad
  subscriptionCmd
    .command("extend")
    .description(
      "extend the subscription identified by on chain subscription id"
    )
    .requiredOption("-i, --subscriptionId <id>", "the id of the subscription")
    .requiredOption(
      "-l, --extendPeriod <number>",
      "the period to extend the subscription"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: extendSubscription started, configPath: %o",
        subscriptionCmd.opts().configPath
      );
      const [account, token, subscription, config] =
        await parseOracleSubscriptionConfiguration(subscriptionCmd.opts());
      await extendSubscription(
        account,
        token,
        subscription,
        options.subscriptionId,
        options.extendPeriod,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: extendSubscription sucess!");
    });

  return subscriptionCmd;
}
