#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const oceanLendingHandler_1 = require("./oceanLendingHandler");
const oracleGovernorHandler_1 = require("./oracleGovernorHandler");
const stakingHandler_1 = require("./stakingHandler");
const subscriptionHandler_1 = require("./subscriptionHandler");
function main() {
    const konomi = new commander_1.Command("konomi");
    // Add nested oceanLending commands.
    konomi.addCommand((0, oceanLendingHandler_1.makeOceanLendingCommand)());
    // Add nested Staking commands.
    konomi.addCommand((0, stakingHandler_1.makeStakingCommand)());
    // Add nested oracleGovernor commands.
    konomi.addCommand((0, oracleGovernorHandler_1.makeOracleGovernorCommand)());
    // Add nested subscription commands.
    konomi.addCommand((0, subscriptionHandler_1.makeSubscriptionCommand)());
    konomi.parse(process.argv);
}
main();
//# sourceMappingURL=konomi.js.map