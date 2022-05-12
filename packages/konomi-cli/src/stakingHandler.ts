import Web3 from 'web3';
import { Command, OptionValues } from 'commander';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/clients/erc20Token';
import { OToken } from '../../ocean-lending/src/clients/oToken';
import { ONE_ETHER } from '../../ocean-lending/src/utils';
import { StakingV1 } from '../../ocean-lending/src/clients/staking';
import logger from './logger';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../../ocean-lending/src/reading';
import { TxnOptions } from '../../ocean-lending/src/options';

interface StakingConfig {
    account: Account,
    token: ERC20Token,
    stakingV1: StakingV1,
    confirmations: TxnOptions
}

interface AccountDetail {
    erc20Balance: string,
    depositedAmount: string,
    totalRewards: string
}

export async function stakeOf(stakingConfig: StakingConfig) {
    await getAccountDetail(stakingConfig, "stakeOf", "after")
}

export async function deposit(stakingConfig: StakingConfig, amount: number) {
    await getAccountDetail(stakingConfig, "deposit", "before")

    const depositAmount = BigInt(amount) * ONE_ETHER;
    await stakingConfig.stakingV1.deposit(depositAmount.toString(), stakingConfig.confirmations);

    await getAccountDetail(stakingConfig, "deposit", "after")
}

export async function withdraw(stakingConfig: StakingConfig, amount: number) {
    await getAccountDetail(stakingConfig, "withdraw", "before")

    const withdrawAmount = BigInt(amount) * ONE_ETHER;
    await stakingConfig.stakingV1.withdraw(withdrawAmount.toString(), stakingConfig.confirmations);

    await getAccountDetail(stakingConfig, "withdraw", "after")
}

export async function withdrawAll(stakingConfig: StakingConfig) {
    await getAccountDetail(stakingConfig, "withdrawAll", "before")

    await stakingConfig.stakingV1.withdrawAll(stakingConfig.confirmations);

    await getAccountDetail(stakingConfig, "withdrawAll", "after")
}

async function getAccountDetail(stakingConfig: StakingConfig, operation: string, status: string): Promise<AccountDetail> {
    const [erc20Balance, stakingInfo] = await Promise.all([
        stakingConfig.token.balanceOf(stakingConfig.account.address),
        stakingConfig.stakingV1.stakeOf(stakingConfig.account.address)
    ])
    const depositedAmount = stakingInfo[0].toString();
    const totalRewards = stakingInfo[1].toString();

    logger.info(` ${status.toUpperCase()} ${operation.toUpperCase()}: balance of erc20 token: ${erc20Balance}, deposited amount: ${depositedAmount}, total rewards: ${totalRewards}`);

    return {
        erc20Balance,
        depositedAmount,
        totalRewards
    }
}

/**
 * Parse Staking Configuration json file.
 */
export async function parseStakingConfiguration(options: OptionValues): Promise<StakingConfig> {
    const config = readJsonSync(options.configPath);

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let account: Account;
    if (config.encryptedAccountJson) {
        const pw = await readPassword();
        account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
        account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
        logger.error('Cannot setup account');
        throw Error("Cannot setup account");
    }

    logger.info('Using account: %o', account.address);

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

    // load the stakingV1 object
    const stakingV1Abi = readJsonSync(options.stakingV1);
    const stakingV1 = new StakingV1(web3, stakingV1Abi, config.stakingV1.address, account);

    const confirmations: TxnOptions = { confirmations: Number(options.confirmations) }

    return { account, token, stakingV1, confirmations };
}

export function makeStakingCommand(): Command {
    // Add staking subcommand
    const staking = new Command('staking');
    staking.description('execute staking command')
        .requiredOption('-c, --config-path <path>', 'staking configuration json path')
        .option('-n, --confirmations <number>', 'number of confirmations of the transaction', '3')
        .option('-f, --oToken <path>', 'staking oToken configuration json path', '../ocean-lending/config/oToken.json')
        .option('-o, --oToken <path>', 'staking oToken configuration json path', '../ocean-lending/config/oToken.json')
        .option('-e, --erc20 <path>', 'staking erc20 configuration json path', '../ocean-lending/config/erc20.json')
        .option('-s, --stakingV1 <path>', 'staking configuration json path', '../ocean-lending/config/stakingV1.json')

    // Add stakes subcommand
    staking
        .command('stakes')
        .description('check the total amount deposited and total rewards')
        .action(async (options: OptionValues) => {
            logger.info('Staking: stakes started, configPath: %o', staking.opts().configPath);
            const stakingConfig = await parseStakingConfiguration(staking.opts());
            await stakeOf(stakingConfig);
            logger.info('Staking: stakes success!');
        });

    // Add deposit subcommand
    staking
        .command('deposit')
        .description('deposit amount into the staking contract')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to deposit')
        .action(async (options: OptionValues) => {
            logger.info('Staking: deposit started, configPath: %o, amount: %o ', staking.opts().configPath, options.amount);
            const stakingConfig = await parseStakingConfiguration(staking.opts());
            await deposit(stakingConfig, options.amount)
            logger.info('Staking: deposit success!');
        });

    // Add withdraw subcommand
    staking
        .command('withdraw')
        .description('withdraw amount into the contract.')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to withdraw')
        .action(async (options: OptionValues) => {
            logger.info('Staking: withdraw started, configPath: %o, amount: %o', staking.opts().configPath, options.amount);
            const stakingConfig = await parseStakingConfiguration(staking.opts());
            await withdraw(stakingConfig, options.amount)
            logger.info('Staking: withdraw success!');
        });

    // Add withdrawAll subcommand
    staking
        .command('withdrawAll')
        .description('withdraw all deposit and reward of user stake into the contract.')
        .action(async (options: OptionValues) => {
            logger.info('Staking: withdrawAll started, configPath: %o', staking.opts().configPath);
            const stakingConfig = await parseStakingConfiguration(staking.opts());
            await withdrawAll(stakingConfig)
            logger.info('Staking: withdrawAll success!');
        });
    return staking;
}