#! /usr/bin/env node
import { Command, OptionValues } from 'commander';
import logger from './logger';
import { enterMarkets, borrow, repay, deposit, redeem, parseOceanLendingConfiguration } from './oceanLendingHandler'

function makeOceanCommand(): Command {
  // Add ocean subcommad
  const ocean = new Command('ocean');
  ocean.description('execute ocean-lending command')
    .requiredOption('-c, --config-path <path>', 'ocean-lending configuration json path')
    .option('-o, --oToken <path>', 'ocean-lending oToken configuration json path', '../ocean-lending/config/oToken.json')
    .option('-e, --erc20 <path>', 'ocean-lending erc20 configuration json path', '../ocean-lending/config/erc20.json')
    .option('-m, --comptroller <path>', 'ocean-lending configuration comptroller json path', '../ocean-lending/config/comptroller.json')
    .option('-p, --priceOracle <path>', 'ocean-lending priceOracle configuration json path', '../ocean-lending/config/priceOracle.json');

  // Add enterMarkets subcommad
  ocean
    .command('enterMarkets')
    .description('enter Markets and check the balance')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets started, configPath: %o', ocean.opts().configPath);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLendingConfiguration(ocean.opts());
      const markets = [config.oTokens.oKono.address];
      await enterMarkets(account, markets, comptroller);
      logger.info('OceanLending: enterMarkets sucess!');
    });

  // Add deposit subcommad
  ocean
    .command('deposit')
    .description('charge otoken deposit with ERC20Token')
    .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: deposit started, configPath: %o, amount: %o ', ocean.opts().configPath, options.amount);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLendingConfiguration(ocean.opts());
      await deposit(account, oToken, token, options.amount)
      logger.info('OceanLending: deposit sucess!');
    });

  // Add redeem subcommad
  ocean
    .command('redeem')
    .description('redeem all minted oToken')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: redeem started, configPath: %o', ocean.opts().configPath);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLendingConfiguration(ocean.opts());
      await redeem(account, oToken, token)
      logger.info('OceanLending: redeem sucess!');
    });

  // Add borrow subcommad
  ocean
    .command('borrow')
    .description('brrow otoken use KONO as collateral')
    .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: borrow started, configPath: %o, amount: %o', ocean.opts().configPath, options.amount);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLendingConfiguration(ocean.opts());
      await borrow(account, oToken, token, priceOracle, comptroller, options.amount);
      logger.info('OceanLending: borrow sucess!');
    });

  // Add repay subcommad
  ocean
    .command('repay')
    .description('repay borrow balance')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: repay started, configPath: %o', ocean.opts().configPath);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLendingConfiguration(ocean.opts());
      await repay(account, oToken, token, priceOracle);
      logger.info('OceanLending: repay sucess!');
    });
  return ocean;
}

async function main() {
  const konomi: Command = new Command('konomi');

  // Add nested ocean commands.
  konomi.addCommand(makeOceanCommand());
  konomi.parse(process.argv);
}

main();