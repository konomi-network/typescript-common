import Web3 from "web3";
import { Account } from "web3-core";
import { Command, OptionValues } from "commander";
import { ERC20Token } from "../../ocean-lending/src/clients/erc20Token";
import { OToken } from "../../ocean-lending/src/clients/oToken";
import { OracleGovernor } from "../../ocean-lending/src/clients/OracleGovernor";
import logger from "./logger";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../../ocean-lending/src/utils";
import { TxnOptions } from "../../ocean-lending/src/options";

const STATUS = new Map([
  ["0", "Active"],
  ["1", "Rejected"],
  ["2", "Approved"],
  ["3", "Executed"],
  ["4", "Canceled"],
]);

export async function state(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt
) {
  const erc20Before = await token.balanceOf(account.address);
  const state = await oracleGovernor.getState(proposalId);
  logger.info(
    "erc20: %o, proposalId: %o, state: %o",
    erc20Before,
    proposalId,
    STATUS.get(state.toString())
  );
}

export async function getProposalDetail(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt
) {
  const [erc20Before, proposalDetail] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getProposalDetail(proposalId),
  ]);
  logger.info(
    "erc20: %o, proposalId: %o, proposalDetail: %o",
    erc20Before,
    proposalId,
    proposalDetail
  );
}

export async function proposeCurrency(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  symbol: string,
  slug: string,
  sources: number[],
  clientType: string,
  leasePeriod: string,
  externalStorageHash: string,
  confirmations: TxnOptions
) {
  const erc20Before = await token.balanceOf(account.address);
  logger.info(
    "erc20Before: %o, symbol: %o, slug: %o, sources: %o, clientType: %o, leasePeriod: %o, externalStorageHash: %o",
    erc20Before,
    symbol,
    slug,
    sources,
    clientType,
    leasePeriod,
    externalStorageHash
  );

  await oracleGovernor.proposeCurrency(
    symbol,
    slug,
    sources,
    clientType,
    leasePeriod,
    externalStorageHash,
    confirmations
  );

  const erc20After = await token.balanceOf(account.address);
  const proposalId = await oracleGovernor.hashProposal(
    symbol,
    slug,
    sources,
    clientType,
    externalStorageHash
  );
  const proposalDetail = await oracleGovernor.getProposalDetail(proposalId);
  logger.info(
    "erc20After: %o, proposalId: %o, proposalDetail: %o",
    erc20After,
    proposalId,
    proposalDetail
  );
}

export async function getProposalId(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  symbol: string,
  slug: string,
  sources: number[],
  clientType: string,
  leasePeriod: string,
  externalStorageHash: string
) {
  const erc20Before = await token.balanceOf(account.address);
  const proposalId = await oracleGovernor.hashProposal(
    symbol,
    slug,
    sources,
    clientType,
    externalStorageHash
  );
  logger.info(
    "erc20: %o, symbol: %o, slug: %o, sources: %o, clientType: %o, leasePeriod: %o, externalStorageHash: %o, proposalId: %o",
    erc20Before,
    symbol,
    slug,
    sources,
    clientType,
    leasePeriod,
    externalStorageHash,
    proposalId
  );
}

export async function execute(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  confirmations: TxnOptions
) {
  const [erc20Before, stateBefore] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
  ]);
  logger.info(
    "erc20Before: %o, proposalId: %o, stateBefore: %o",
    erc20Before,
    proposalId,
    STATUS.get(stateBefore.toString())
  );

  await oracleGovernor.execute(proposalId, confirmations);

  const [erc20After, stateAfter] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
  ]);
  logger.info(
    "erc20After: %o, proposalId: %o, stateAfter: %o",
    erc20After,
    proposalId,
    STATUS.get(stateAfter.toString())
  );
}

export async function cancel(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  confirmations: TxnOptions
) {
  const [erc20Before, stateBefore] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
  ]);
  logger.info(
    "erc20Before: %o, proposalId: %o, stateBefore: %o",
    erc20Before,
    proposalId,
    STATUS.get(stateBefore.toString())
  );

  await oracleGovernor.cancel(proposalId, confirmations);

  const [erc20After, stateAfter] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
  ]);
  logger.info(
    "erc20After: %o, proposalId: %o, stateAfter: %o",
    erc20After,
    proposalId,
    STATUS.get(stateAfter.toString())
  );
}

export async function hasVoted(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt
) {
  const [erc20Before, state, voted] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
    oracleGovernor.hasVoted(proposalId, account),
  ]);
  logger.info(
    "erc20: %o, proposalId: %o, state: %o, voted: %o",
    erc20Before,
    proposalId,
    STATUS.get(state.toString()),
    voted
  );
}

async function castVote(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  voteType: number,
  confirmations: TxnOptions
) {
  const [erc20Before, stateBefore, proposalDetailBefore] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
    oracleGovernor.getProposalDetail(proposalId),
  ]);
  logger.info(
    "erc20Before: %o, proposalId: %o, stateBefore: %o, forVotesBefore: %o, againstVotesBefore: %o",
    erc20Before,
    proposalId,
    STATUS.get(stateBefore.toString()),
    proposalDetailBefore.get("forVotes"),
    proposalDetailBefore.get("againstVotes")
  );

  await oracleGovernor.castVote(proposalId, voteType, confirmations);

  const [erc20After, stateAfter, proposalDetailAfter] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
    oracleGovernor.getProposalDetail(proposalId),
  ]);
  logger.info(
    "erc20After: %o, proposalId: %o, stateAfter: %o, voteType: %o, forVotesAfter: %o, againstVotesAfter: %o",
    erc20After,
    proposalId,
    STATUS.get(stateAfter.toString()),
    voteType,
    proposalDetailAfter.get("forVotes"),
    proposalDetailAfter.get("againstVotes")
  );
}

async function castVoteWithReason(
  account: Account,
  token: ERC20Token,
  oracleGovernor: OracleGovernor,
  proposalId: BigInt,
  voteType: number,
  reason: string
) {
  const [erc20Before, stateBefore, proposalDetailBefore] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
    oracleGovernor.getProposalDetail(proposalId),
  ]);

  logger.info(
    "erc20Before: %o, proposalId: %o, stateBefore: %o, voteType: %o, reason: %o, forVotesAfter: %o, againstVotesAfter: %o",
    erc20Before,
    proposalId,
    STATUS.get(stateBefore.toString()),
    voteType,
    reason,
    proposalDetailBefore.get("forVotes"),
    proposalDetailBefore.get("againstVotes")
  );

  await oracleGovernor.castVoteWithReason(proposalId, voteType, reason, {
    confirmations: 3,
  });

  const [erc20After, stateAfter, proposalDetailAfter] = await Promise.all([
    token.balanceOf(account.address),
    oracleGovernor.getState(proposalId),
    oracleGovernor.getProposalDetail(proposalId),
  ]);
  logger.info(
    "erc20After: %o, proposalId: %o, stateAfter: %o, forVotesAfter: %o, againstVotesAfter: %o",
    erc20After,
    proposalId,
    STATUS.get(stateAfter.toString()),
    proposalDetailAfter.get("forVotes"),
    proposalDetailAfter.get("againstVotes")
  );
}

/**
 * Parse oracleGovernor Configuration json file.
 */
export async function parseOracleGovernorConfiguration(options: OptionValues) {
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

  // load the oracleGovernor object
  const oracleGovernorAbi = readJsonSync(options.oracleGovernor);
  const oracleGovernor = new OracleGovernor(
    web3,
    oracleGovernorAbi,
    config.oracleGovernor.address,
    account
  );

  return [account, token, oracleGovernor, config] as const;
}

export function makeOracleGovernorCommand(): Command {
  // Add oracleGovernor subcommad
  const oracleGovernorCmd = new Command("proposal");
  oracleGovernorCmd
    .description("execute oracleGovernor command")
    .requiredOption("-c, --config-path <path>", "configuration json path")
    .option(
      "-o, --oToken <path>",
      "oracleGovernor oToken configuration json path",
      "../ocean-lending/config/oToken.json"
    )
    .option(
      "-e, --erc20 <path>",
      "oracleGovernor erc20 configuration json path",
      "../ocean-lending/config/erc20.json"
    )
    .option(
      "-e, --oracleGovernor <path>",
      "oracleGovernor configuration json path",
      "../ocean-lending/config/oracleGovernor.json"
    );

  // Add stakes subcommad
  oracleGovernorCmd
    .command("state")
    .description("derive the state of the proposal")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: state started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await state(account, token, oracleGovernor, options.proposalId);
      logger.info("OracleGovernor: state sucess!");
    });

  // Add proposalDetail subcommad
  oracleGovernorCmd
    .command("details")
    .description("fetch the details of the proposal")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: proposalDetail started, configPath: %o,",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await getProposalDetail(
        account,
        token,
        oracleGovernor,
        options.proposalId
      );
      logger.info("OracleGovernor: proposalDetail sucess!");
    });

  // Add hashProposal subcommad
  oracleGovernorCmd
    .command("hash")
    .description("hash the proposal's properties to get proposalId")
    .requiredOption("-s, --symbol <str>", "the symbol of proposal")
    .requiredOption("-u, --slug <str>", "the slug of proposal")
    .requiredOption(
      "-r, --sources <array>",
      "the sources of proposal, splited by ','"
    )
    .requiredOption("-t, --clientType <str>", "the clientType of proposal")
    .requiredOption("-l, --leasePeriod <str>", "the leasePeriod of proposal")
    .requiredOption(
      "-x, --externalStorageHash <str>",
      "the externalStorageHash of proposal"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: hashProposal started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await getProposalId(
        account,
        token,
        oracleGovernor,
        options.symbol,
        options.slug,
        String(options.sources)
          .split(",")
          .map((s) => {
            return Number(s);
          }),
        options.clientType,
        options.leasePeriod,
        options.externalStorageHash
      );
      logger.info("OracleGovernor: hashProposal sucess!");
    });

  // Add proposeCurrency subcommad
  oracleGovernorCmd
    .command("propose")
    .description("propose a new currency in the Oracle")
    .requiredOption("-s, --symbol <str>", "the symbol of proposal")
    .requiredOption("-u, --slug <str>", "the slug of proposal")
    .requiredOption(
      "-r, --sources <array>",
      "the sources of proposal, splited by ','"
    )
    .requiredOption("-t, --clientType <str>", "the clientType of proposal")
    .requiredOption("-l, --leasePeriod <str>", "the leasePeriod of proposal")
    .requiredOption(
      "-x, --externalStorageHash <str>",
      "the externalStorageHash of proposal"
    )
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: proposeCurrency started, configPath: %o,",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await proposeCurrency(
        account,
        token,
        oracleGovernor,
        options.symbol,
        options.slug,
        String(options.sources)
          .split(",")
          .map((s) => {
            return Number(s);
          }),
        options.clientType,
        options.leasePeriod,
        options.externalStorageHash,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: proposeCurrency sucess!");
    });

  // Add execute subcommad
  oracleGovernorCmd
    .command("execute")
    .description("execute the proposal by the proposal id")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: execute started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await execute(
        account,
        token,
        oracleGovernor,
        options.proposalId,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: execute sucess!");
    });

  // Add cancel subcommad
  oracleGovernorCmd
    .command("cancel")
    .description("cancel the proposal by the proposal id")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: cancel started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await cancel(
        account,
        token,
        oracleGovernor,
        options.proposalId,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: cancel sucess!");
    });

  // Add hasVoted subcommad
  oracleGovernorCmd
    .command("hasVoted")
    .description("check whether votes have been cast")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: hasVoted started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await hasVoted(account, token, oracleGovernor, options.proposalId);
      logger.info("OracleGovernor: hasVoted sucess!");
    });

  // Add castVote subcommad
  oracleGovernorCmd
    .command("castVote")
    .description("cast vote by proposalId")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .requiredOption("-t, --type <number>", "the type of the vote")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: castVote started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await castVote(
        account,
        token,
        oracleGovernor,
        options.proposalId,
        options.type,
        config.clients.txnOptions
      );
      logger.info("OracleGovernor: castVote sucess!");
    });

  // Add castVoteWithReason subcommad
  oracleGovernorCmd
    .command("castVoteWithReason")
    .description("cast vote by proposalId with specific reason")
    .requiredOption("-i, --proposalId <id>", "the id of the proposal")
    .requiredOption("-t, --type <type>", "the type of the vote")
    .requiredOption("-r, --reason <str>", "the reason of the vote")
    .action(async (options: OptionValues) => {
      logger.info(
        "OracleGovernor: castVoteWithReason started, configPath: %o",
        oracleGovernorCmd.opts().configPath
      );
      const [account, token, oracleGovernor, config] =
        await parseOracleGovernorConfiguration(oracleGovernorCmd.opts());
      await castVoteWithReason(
        account,
        token,
        oracleGovernor,
        options.proposalId,
        options.type,
        options.reason
      );
      logger.info("OracleGovernor: castVoteWithReason sucess!");
    });

  return oracleGovernorCmd;
}
