#! /usr/bin/env node
import { Command } from "commander";
import { makeOceanLendingCommand } from "./oceanLendingHandler";
import { makeOracleGovernorCommand } from "./oracleGovernorHandler";
import { makeStakingCommand } from "./stakingHandler";
import { makeSubscriptionCommand } from "./subscriptionHandler";

function main() {
  const konomi: Command = new Command("konomi");

  // Add nested oceanLending commands.
  konomi.addCommand(makeOceanLendingCommand());

  // Add nested Staking commands.
  konomi.addCommand(makeStakingCommand());

  // Add nested oracleGovernor commands.
  konomi.addCommand(makeOracleGovernorCommand());

  // Add nested subscription commands.
  konomi.addCommand(makeSubscriptionCommand());

  konomi.parse(process.argv);
}

main();
