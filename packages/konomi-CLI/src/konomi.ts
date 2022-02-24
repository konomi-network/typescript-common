import { exit } from 'process';
import { Command, Option, OptionValues } from 'commander';
import { OceanLendingHandler } from './CommandHandler';

async function main() {
  const program: Command = new Command();
  program
    .option('-d, --debug', 'output extra debugging')
    .requiredOption('-p, --config-path <path>', 'config path')
    .addOption(new Option('-c, --cmd <command>', 'konomi client command').choices(['ocean']))
    .addOption(new Option('-s, --sub-cmd <sub-command>', 'konomi client sub-command').choices(['enterMarkets','depositWorks','redeemNoBorrow', 'borrow', 'repay']))
    .option('-t, --token <address>', 'token address', 'defualt address')
    .option('-a, --amount <token>', 'The amount of tokens to use for operations');

  program.parse(process.argv);
  const options: OptionValues = program.opts();
  if (options.debug) console.log(options);

  switch (options.cmd) {
      case 'ocean':
          console.log("oceanlending command started.");
          const oceanLendingHandler = new OceanLendingHandler(options.configPath,options.subCmd, options.tokenAddress, options.amount)
          await oceanLendingHandler.handle();
          console.log("oceanlending command finished.");
        break;

      default:
          console.log("unknown command.")
          break;
  }
}

main()
	.then(() => exit(0))
	.catch((e) => {
		console.log(e);
		exit(1);
	});