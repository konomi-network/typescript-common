#! /usr/bin/env node
import { Command } from "commander";
import { makeOceanLendingCommand } from "./oceanLendingHandler";
import { makeStakingCommand } from "./stakingHandler";

function main() {
  const konomi: Command = new Command('konomi');

  // Add nested oceanLending commands.
  konomi.addCommand(makeOceanLendingCommand());
  // Add nested Staking commands.
  konomi.addCommand(makeStakingCommand());

  konomi.parse(process.argv);
}

main();