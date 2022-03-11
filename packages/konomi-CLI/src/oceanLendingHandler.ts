import Web3 from "web3";
import { Command, OptionValues } from "commander";
import { Account } from "web3-core";
import { ERC20Token } from "../../ocean-lending/src/clients/erc20Token";
import { OToken } from "../../ocean-lending/src/clients/oToken";
import { Comptroller } from "../../ocean-lending/src/clients/comptroller";
import { JumpInterestV2 } from "../../ocean-lending/src/clients/jumpInterestV2";
import { ONE_ETHER } from "../../ocean-lending/src/utils";
import logger from "./logger";

import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../../ocean-lending/src/utils";
import { TxnOptions } from "../../ocean-lending/src/options";

// Interfaces related to OToken
export async function enterMarkets(
  account: Account,
  markets: string[],
  comptroller: Comptroller,
  confirmations: TxnOptions
) {
  await comptroller.enterMarkets(markets, confirmations);

  const liquidity: number = await comptroller.getAccountLiquidity(
    account.address
  );
  logger.info(
    "enterMarkets: You have %o of LIQUID assets (worth of USD) pooled in the protocol.",
    liquidity
  );

  const konoCollateralFactor: number = await comptroller.markets(markets[0]);
  logger.info(
    "enterMarkets: You can borrow up to %o% of your TOTAL collateral supplied to the protocol as oKONO.",
    konoCollateralFactor
  );
}

export async function borrow(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller,
  underlyingToBorrow: number,
  confirmations: TxnOptions
) {
  const liquidity: number = await comptroller.getAccountLiquidity(
    account.address
  );
  if (liquidity.valueOf() <= 0) {
    logger.error("You don't have any liquid assets pooled in the protocol.");
  }

  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const borrowBalanceBefore = await oToken.borrowBalanceCurrent(
    account.address
  );
  if (oTokenBefore.valueOf() <= BigInt(0)) {
    logger.error("You don't have any KONO as collateral.");
  }
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o",
    erc20Before,
    oTokenBefore,
    borrowBalanceBefore
  );
  logger.warn(
    "NEVER borrow near the maximum amount because your account will be instantly liquidated."
  );

  const underlyingDecimals = 18;
  const scaledUpBorrowAmount =
    underlyingToBorrow * Math.pow(10, underlyingDecimals);
  await oToken.borrow(scaledUpBorrowAmount, confirmations);
  await oToken.approve(scaledUpBorrowAmount, confirmations);
  const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);
  logger.info(
    "erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o",
    erc20After,
    oTokenAfter,
    borrowBalanceAfter
  );
}

export async function repay(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  amount: number,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const borrowBalanceBefore = await oToken.borrowBalanceCurrent(
    account.address
  );
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o",
    erc20Before,
    oTokenBefore,
    borrowBalanceBefore
  );
  if (borrowBalanceBefore <= 0) {
    logger.error("invalid borrow balance to repay, expected more than zero");
  }
  if (amount > borrowBalanceBefore) {
    logger.error("the repayment amount exceeds the borrow balance");
  }

  const repayAmount = BigInt(amount) * ONE_ETHER;
  await oToken.repayBorrow(BigInt(repayAmount), confirmations);

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);
  const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
  logger.info(
    "erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o",
    erc20After,
    oTokenAfter,
    borrowBalanceAfter
  );
}

export async function repayAll(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const borrowBalanceBefore = await oToken.borrowBalanceCurrent(
    account.address
  );
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, borrowBalanceBefore: %o",
    erc20Before,
    oTokenBefore,
    borrowBalanceBefore
  );
  logger.info("total borrow balance to repay is: %o", borrowBalanceBefore);
  if (borrowBalanceBefore <= 0) {
    logger.error("invalid borrow balance to repay, expected more than zero");
  }

  await oToken.repayBorrow(BigInt(borrowBalanceBefore), confirmations);

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);
  const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
  logger.info(
    "erc20After: %o, oTokenAfter: %o, borrowBalanceAfter: %o",
    erc20After,
    oTokenAfter,
    borrowBalanceAfter
  );
}

export async function deposit(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  amount: number,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  logger.info("erc20Before: %o, oTokenBefore: %o", erc20Before, oTokenBefore);

  const depositAmount = BigInt(amount) * ONE_ETHER;
  await oToken.mint(depositAmount, confirmations);

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);
  logger.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
}

export async function redeem(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  amount: number,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  const oTokenToRedeem =
    BigInt(amount) * BigInt(Math.pow(10, oToken.parameters.decimals));
  logger.info(
    "erc20Before: %o, oToken minted: %o, oToken to redeem: %o",
    erc20Before,
    oTokenBefore,
    oTokenToRedeem
  );

  await oToken.redeem(oTokenToRedeem, confirmations);
  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  logger.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
}

export async function redeemAll(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, oToken minted: %o, oToken to redeem: %o",
    erc20Before,
    oTokenBefore,
    oTokenBefore
  );

  await oToken.redeem(oTokenBefore, confirmations);
  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  logger.info("erc20After: %o, oTokenAfter: %o", erc20After, oTokenAfter);
}

// Interfaces related to Comptroller
export async function liquidationIncentive(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  const [erc20Before, oTokenBefore, incentive] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    comptroller.liquidationIncentive(),
  ]);
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, liquidationIncentive: %o",
    erc20Before,
    oTokenBefore,
    incentive
  );
}

export async function collateralFactor(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  const [erc20Before, oTokenBefore, collateralFactor] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    comptroller.collateralFactor(account.address),
  ]);
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, collateralFactor: %o%",
    erc20Before,
    oTokenBefore,
    collateralFactor
  );
}

export async function closeFactor(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  comptroller: Comptroller
) {
  const [erc20Before, oTokenBefore, closeFactor] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    comptroller.closeFactor(account.address),
  ]);
  logger.info(
    "erc20Before: %o, oTokenBefore: %o, closeFactor: %o%",
    erc20Before,
    oTokenBefore,
    closeFactor
  );
}

// Interfaces related to JumpInterestV2
export async function multiplierPerBlock(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, multiplier] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.multiplierPerBlock(),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, multiplierPerBlock: %o",
    erc20Before,
    oTokenBefore,
    multiplier
  );
}

export async function baseRatePerBlock(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, baseRate] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.baseRatePerBlock(),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, baseRatePerBlock: %o",
    erc20Before,
    oTokenBefore,
    baseRate
  );
}

export async function jumpMultiplierPerBlock(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, jumpMultiplier] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.jumpMultiplierPerBlock(),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, jumpMultiplierPerBlock: %o",
    erc20Before,
    oTokenBefore,
    jumpMultiplier
  );
}

export async function kink(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, _kink] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.kink(),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, kink: %o",
    erc20Before,
    oTokenBefore,
    _kink
  );
}

export async function getBorrowRate(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, borrowRate] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.getBorrowRate(oToken),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, borrowRate: %o",
    erc20Before,
    oTokenBefore,
    borrowRate
  );
}

export async function getSupplyRate(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2
) {
  const [erc20Before, oTokenBefore, supplyRate] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.getSupplyRate(oToken),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, supplyRate: %o",
    erc20Before,
    oTokenBefore,
    supplyRate
  );
}

export async function getBorrowRateAPY(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2,
  blockTime: number
) {
  const [erc20Before, oTokenBefore, borrowRateAPY] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.getBorrowRateAPY(oToken, blockTime),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, borrowRateAPY: %o",
    erc20Before,
    oTokenBefore,
    borrowRateAPY
  );
}

export async function getSupplyRateAPY(
  account: Account,
  oToken: OToken,
  token: ERC20Token,
  jumpInterestV2: JumpInterestV2,
  blockTime: number
) {
  const [erc20Before, oTokenBefore, supplyRateAPY] = await Promise.all([
    token.balanceOf(account.address),
    oToken.balanceOf(account.address),
    jumpInterestV2.getSupplyRateAPY(oToken, blockTime),
  ]);
  logger.info(
    "erc20: %o, oToken: %o, supplyRateAPY: %o",
    erc20Before,
    oTokenBefore,
    supplyRateAPY
  );
}

/**
 * parse OceanLending Configuration json file.
 */
export async function parseOceanLendingConfiguration(options: OptionValues) {
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

  const comptrollerAbi = readJsonSync(options.comptroller);
  const comptroller = new Comptroller(
    web3,
    comptrollerAbi,
    oToken.parameters.comptroller,
    account
  );

  // load JumpInterestV2 object
  const jumpInterestV2Abi = readJsonSync(options.jumpInterestV2);
  const jumpInterestV2 = new JumpInterestV2(
    web3,
    jumpInterestV2Abi,
    config.jumpInterestV2.address,
    account
  );

  return [account, oToken, token, comptroller, config, jumpInterestV2] as const;
}

export function makeOceanLendingCommand(): Command {
  // Add ocean subcommad
  const ocean = new Command("ocean");
  ocean
    .description("execute ocean-lending command")
    .requiredOption(
      "-c, --config-path <path>",
      "ocean-lending configuration json path"
    )
    .option(
      "-o, --oToken <path>",
      "ocean-lending oToken configuration json path",
      "../ocean-lending/config/oToken.json"
    )
    .option(
      "-e, --erc20 <path>",
      "ocean-lending erc20 configuration json path",
      "../ocean-lending/config/erc20.json"
    )
    .option(
      "-m, --comptroller <path>",
      "ocean-lending configuration comptroller json path",
      "../ocean-lending/config/comptroller.json"
    )
    .option(
      "-p, --priceOracle <path>",
      "ocean-lending priceOracle configuration json path",
      "../ocean-lending/config/priceOracle.json"
    )
    .option(
      "-j, --jumpInterestV2 <path>",
      "ocean-lending jumpInterestV2 configuration json path",
      "../ocean-lending/config/jumpInterestV2.json"
    );

  // Add enterMarkets subcommad
  ocean
    .command("enterMarkets")
    .description("enter Markets and check the balance")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: enterMarkets started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      const markets = [config.oTokens.oKono.address];
      await enterMarkets(
        account,
        markets,
        comptroller,
        config.clients.txnOptions
      );
      logger.info("OceanLending: enterMarkets sucess!");
    });

  // Add deposit subcommad
  ocean
    .command("deposit")
    .description("charge otoken deposit with ERC20Token")
    .requiredOption("-a, --amount <amount>", "the amount of tokens to deposit")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: deposit started, configPath: %o, amount: %o ",
        ocean.opts().configPath,
        options.amount
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await deposit(
        account,
        oToken,
        token,
        options.amount,
        config.clients.txnOptions
      );
      logger.info("OceanLending: deposit sucess!");
    });

  // Add redeem subcommad
  ocean
    .command("redeem")
    .description("redeem minted oToken")
    .requiredOption("-a, --amount <amount>", "the amount of tokens to redeem")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: redeem started, configPath: %o, amount: %o",
        ocean.opts().configPath,
        options.amount
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await redeem(
        account,
        oToken,
        token,
        options.amount,
        config.clients.txnOptions
      );
      logger.info("OceanLending: redeem sucess!");
    });

  // Add redeemAll subcommad
  ocean
    .command("redeemAll")
    .description("redeem all minted oToken")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: redeemAll started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await redeemAll(account, oToken, token, config.clients.txnOptions);
      logger.info("OceanLending: redeemAll sucess!");
    });

  // Add borrow subcommad
  ocean
    .command("borrow")
    .description("brrow otoken use KONO as collateral")
    .requiredOption("-a, --amount <amount>", "the amount of tokens to borrow")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: borrow started, configPath: %o, amount: %o",
        ocean.opts().configPath,
        options.amount
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await borrow(
        account,
        oToken,
        token,
        comptroller,
        options.amount,
        config.clients.txnOptions
      );
      logger.info("OceanLending: borrow sucess!");
    });

  // Add repay subcommad
  ocean
    .command("repay")
    .description("repay borrow balance")
    .requiredOption("-a, --amount <amount>", "the amount of tokens to reapy")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: repay started, configPath: %o, amount: %o",
        ocean.opts().configPath,
        options.amount
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await repay(
        account,
        oToken,
        token,
        options.amount,
        config.clients.txnOptions
      );
      logger.info("OceanLending: repay sucess!");
    });

  // Add repayAll subcommad
  ocean
    .command("repayAll")
    .description("repay all borrow balance")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: repayAll started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await repayAll(account, oToken, token, config.clients.txnOptions);
      logger.info("OceanLending: repayAll sucess!");
    });

  // Add liquidationIncentive subcommad
  ocean
    .command("incentive")
    .description("incentive to perform liquidation of underwater accounts")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: liquidationIncentive started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await liquidationIncentive(account, oToken, token, comptroller);
      logger.info("OceanLending: liquidationIncentive sucess!");
    });

  // Add collateralFactor subcommad
  ocean
    .command("collateralFactor")
    .description("oToken's collateral factor, range from 0-90%")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: collateralFactor started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await collateralFactor(account, oToken, token, comptroller);
      logger.info("OceanLending: collateralFactor sucess!");
    });

  // Add closeFactor subcommad
  ocean
    .command("closeFactor")
    .description("oToken's close factor, range from 0-100%")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: closeFactor started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await closeFactor(account, oToken, token, comptroller);
      logger.info("OceanLending: closeFactor sucess!");
    });

  // Add multiplierPerBlock subcommad
  ocean
    .command("multiplier")
    .description(
      "the multiplier of utilization rate that gives the slope of the interest rate."
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: multiplierPerBlock started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await multiplierPerBlock(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: multiplierPerBlock sucess!");
    });

  // Add baseRatePerBlock subcommad
  ocean
    .command("baseRate")
    .description(
      "the base interest rate which is the y-intercept when utilization rate is 0"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: baseRatePerBlock started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await baseRatePerBlock(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: baseRatePerBlock sucess!");
    });

  // Add jumpMultiplierPerBlock subcommad
  ocean
    .command("jumpMultiplier")
    .description(
      "the multiplierPerBlock after hitting a specified utilization point"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: jumpMultiplierPerBlock started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await jumpMultiplierPerBlock(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: jumpMultiplierPerBlock sucess!");
    });

  // Add kink subcommad
  ocean
    .command("kink")
    .description(
      "the utilization point at which the jump multiplier is applied"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: kink started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await kink(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: kink sucess!");
    });

  // Add getBorrowRate subcommad
  ocean
    .command("borrowRate")
    .description("the current borrow interest rate per block")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: getBorrowRate started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await getBorrowRate(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: getBorrowRate sucess!");
    });

  // Add getSupplyRate subcommad
  ocean
    .command("supplyRate")
    .description("the current supply interest rate per block")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: getSupplyRate started, configPath: %o",
        ocean.opts().configPath
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await getSupplyRate(account, oToken, token, jumpInterestV2);
      logger.info("OceanLending: getSupplyRate sucess!");
    });

  // Add getBorrowRateAPY subcommad
  ocean
    .command("borrowRateAPY")
    .description("the current borrow interest rate APY")
    .requiredOption("-t, --blockTime <time>", "the number of seconds per block")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: getBorrowRateAPY started, configPath: %o, blockTime: %o",
        ocean.opts().configPath,
        options.blockTime
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await getBorrowRateAPY(
        account,
        oToken,
        token,
        jumpInterestV2,
        options.blockTime
      );
      logger.info("OceanLending: getBorrowRate sucess!");
    });

  // Add getSupplyRateAPY subcommad
  ocean
    .command("supplyRateAPY")
    .description("the current supply interest rate APY")
    .requiredOption("-t, --blockTime <time>", "the number of seconds per block")
    .action(async (options: OptionValues) => {
      logger.info(
        "OceanLending: getSupplyRateAPY started, configPath: %o, blockTime: %o",
        ocean.opts().configPath,
        options.blockTime
      );
      const [account, oToken, token, comptroller, config, jumpInterestV2] =
        await parseOceanLendingConfiguration(ocean.opts());
      await getSupplyRateAPY(
        account,
        oToken,
        token,
        jumpInterestV2,
        options.blockTime
      );
      logger.info("OceanLending: getSupplyRateAPY sucess!");
    });

  return ocean;
}
