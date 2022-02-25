import { exit } from 'process';
import { Command, Option, OptionValues } from 'commander';
import { parseOceanLeningConfiguration } from './utils';
import { depositWorks, redeemNoBorrow } from '../../ocean-lending/integration-tests/deposit';
import { borrow, enterMarkets, repayBorrow } from '../../ocean-lending/integration-tests/borrow';
import logger from './logger';

function makeOceanCommand(): Command {
  const ocean = new Command('ocean');
  ocean.description('execute ocean-lending command')
  // Add enterMarkets subcommad
  ocean
    .command('enterMarkets')
    .description('enter Markets and check the balance')
    .requiredOption('-c, --config-path <configPath>', 'config path')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets configPath: %o', options.configPath);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLeningConfiguration(options.configPath);
      const markets = [config.oTokens.oKono.address];
      await enterMarkets(account, markets, comptroller);
      logger.info('OceanLending: enterMarkets sucess!');
    });

  // Add deposit subcommad
  ocean
    .command('deposit')
    .description('charge otoken deposit with ERC20Token')
    .requiredOption('-c, --config-path <path>', 'config path')
    .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets configPath: %o amount: %o ', options.configPath, options.amount);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLeningConfiguration(options.configPath);
      await depositWorks(account, oToken, token, options.amount)
      logger.info('OceanLending: deposit sucess!');
    });

  // Add redeem subcommad
  ocean
    .command('redeem')
    .description('redeem all minted oToken')
    .requiredOption('-c, --config-path <path>', 'config path')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets configPath: %o', options.configPath);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLeningConfiguration(options.configPath);
      await redeemNoBorrow(account, oToken, token)
      logger.info('OceanLending: redeem sucess!');
    });

  // Add borrow subcommad
  ocean
    .command('borrow')
    .description('brrow otoken use KONO as collateral')
    .requiredOption('-c, --config-path <path>', 'config path')
    .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets configPath: %o amount: %o ', options.configPath, options.amount);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLeningConfiguration(options.configPath);
      await borrow(account, oToken, token, priceOracle, comptroller, options.amount);
      logger.info('OceanLending: borrow sucess!');  
    });

  // Add repay subcommad
  ocean
    .command('repay')
    .description('repay borrow balance')
    .requiredOption('-c, --config-path <path>', 'config path')
    .requiredOption('-a, --amount <amount>', 'The amount of tokens to use for operations')
    .action(async (options: OptionValues) => {
      logger.info('OceanLending: enterMarkets configPath: %o amount: %o ', options.configPath, options.amount);
      const [account, oToken, token, comptroller, config, priceOracle] = await parseOceanLeningConfiguration(options.configPath);
      await repayBorrow(account, oToken, token, priceOracle);
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