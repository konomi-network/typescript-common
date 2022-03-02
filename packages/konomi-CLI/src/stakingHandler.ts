import Web3 from 'web3';
import { Command, OptionValues } from 'commander';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/erc20Token';
import { OToken } from '../../ocean-lending/src/oToken';
import { ONE_ETHER } from '../../ocean-lending/src/utils';
import { StakingV1 } from '../../ocean-lending/src/clients/staking';
import logger from './logger';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../../ocean-lending/src/utils';

export async function stakeOf(account: Account, token: ERC20Token, stakingV1: StakingV1) {
    const erc20Before = await token.balanceOf(account.address);
    const [depositedAmount, totalReward] = await stakingV1.stakeOf(account.address);
    logger.info('erc20: %o, depositedAmountBefore: %o, totalRewardsBefore: %o', erc20Before, depositedAmount, totalReward);
}

export async function deposit(account: Account, token: ERC20Token, stakingV1: StakingV1, amount: number) {
    const erc20Before = await token.balanceOf(account.address);
    const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(account.address);
    logger.info('erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o', erc20Before, depositedAmountBefore, totalRewardsBefore);

    const depositAmount = BigInt(amount) * ONE_ETHER;
    await stakingV1.deposit(depositAmount.toString(), { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(account.address);
    logger.info('erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o', erc20After, depositedAmountAfter, totalRewardsAfter);
}

export async function withdraw(account: Account, token: ERC20Token, stakingV1: StakingV1, amount: number) {
    const erc20Before = await token.balanceOf(account.address);
    const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(account.address);
    logger.info('erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o', erc20Before, depositedAmountBefore, totalRewardsBefore);

    const withdrawAmount = BigInt(amount) * ONE_ETHER;
    await stakingV1.withdraw(withdrawAmount.toString(), { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(account.address);
    logger.info('erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o', erc20After, depositedAmountAfter, totalRewardsAfter);
}

export async function withdrawAll(account: Account, token: ERC20Token, stakingV1: StakingV1) {
    const erc20Before = await token.balanceOf(account.address);
    const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(account.address);
    logger.info('erc20Before: %o, depositedAmountBefore: %o, totalRewardsBefore: %o', erc20Before, depositedAmountBefore, totalRewardsBefore);

    await stakingV1.withdrawAll({ confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(account.address);
    logger.info('erc20After: %o, depositedAmountAfter: %o, totalRewardsAfter: %o', erc20After, depositedAmountAfter, totalRewardsAfter);
}

/**
 * Parse Staking Configuration json file.
 */
export async function parseStakingConfiguration(options: OptionValues) {
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

    return [account, token, stakingV1] as const;
}

export function makeStakingCommand(): Command {
    // Add staking subcommad
    const staking = new Command('staking');
    staking.description('execute staking command')
        .requiredOption('-c, --config-path <path>', 'staking configuration json path')
        .option('-o, --oToken <path>', 'staking oToken configuration json path', '../ocean-lending/config/oToken.json')
        .option('-e, --erc20 <path>', 'staking erc20 configuration json path', '../ocean-lending/config/erc20.json')
        .option('-e, --stakingV1 <path>', 'staking configuration json path', '../ocean-lending/config/stakingV1.json')

    // Add stakes subcommad
    staking
        .command('stakes')
        .description('check the total amount deposited and total rewards')
        .action(async (options: OptionValues) => {
            logger.info('Staking: stakes started, configPath: %o', staking.opts().configPath);
            const [account, token, stakingV1] = await parseStakingConfiguration(staking.opts());
            await stakeOf(account, token, stakingV1);
            logger.info('Staking: stakes sucess!');
        });

    // Add deposit subcommad
    staking
        .command('deposit')
        .description('deposit amount into the staking contract')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to deposit')
        .action(async (options: OptionValues) => {
            logger.info('Staking: deposit started, configPath: %o, amount: %o ', staking.opts().configPath, options.amount);
            const [account, token, stakingV1] = await parseStakingConfiguration(staking.opts());
            await deposit(account, token, stakingV1, options.amount)
            logger.info('Staking: deposit sucess!');
        });

    // Add withdraw subcommad
    staking
        .command('withdraw')
        .description('withdraw amount into the contract.')
        .requiredOption('-a, --amount <amount>', 'The amount of tokens to withdraw')
        .action(async (options: OptionValues) => {
            logger.info('Staking: withdraw started, configPath: %o, amount: %o', staking.opts().configPath, options.amount);
            const [account, token, stakingV1] = await parseStakingConfiguration(staking.opts());
            await withdraw(account, token, stakingV1, options.amount)
            logger.info('Staking: withdraw sucess!');
        });

    // Add withdrawAll subcommad
    staking
        .command('withdrawAll')
        .description('withdraw all deposit and reward of user stake into the contract.')
        .action(async (options: OptionValues) => {
            logger.info('Staking: withdrawAll started, configPath: %o', staking.opts().configPath);
            const [account, token, stakingV1] = await parseStakingConfiguration(staking.opts());
            await withdrawAll(account, token, stakingV1)
            logger.info('Staking: withdrawAll sucess!');
        });
    return staking;
}