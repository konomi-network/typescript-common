import { ERC20Token } from "clients/erc20Token";
import { OToken } from "clients/oToken";
import { exit } from "process";
import Web3 from "web3";
import { Account } from "web3-core";
import { StakingV1 } from "clients/staking";
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  ONE_ETHER,
  readJsonSync,
  readPassword,
} from "../src/utils";

async function main() {
  // const config = readJsonSync('./config/config.json');
  const config = readJsonSync("./testConfig/config.json");

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
    throw Error("Cannot setup account");
  }

  console.log("Using account:", account);

  // load the stakingV1 object
  const stakingV1Abi = readJsonSync("./config/stakingV1.json");
  const stakingV1 = new StakingV1(
    web3,
    stakingV1Abi,
    config.stakingV1.address,
    account
  );

  // load the oToken object
  const oTokenAbi = readJsonSync("./config/oToken.json");
  const oToken = new OToken(
    web3,
    oTokenAbi,
    config.oTokens.oKono.address,
    account,
    config.oTokens.oKono.parameters
  );

  // load the erc20 token object
  const erc20Abi = readJsonSync("./config/erc20.json");
  const erc20Token = new ERC20Token(
    web3,
    erc20Abi,
    oToken.parameters.underlying,
    account
  );

  const amount = 1000;
  await stakeOfTest(account, erc20Token, stakingV1);
  await depositTest(account, erc20Token, stakingV1, amount);
  await withdrawTest(account, erc20Token, stakingV1, 100);
  await withdrawAllTest(account, erc20Token, stakingV1);
}

// Check the depositedAmount and totalReward
async function stakeOfTest(
  account: Account,
  token: ERC20Token,
  stakingV1: StakingV1
) {
  const erc20 = await token.balanceOf(account.address);
  const [depositedAmount, totalReward] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    `erc20: ${erc20}, depositedAmount: ${depositedAmount}, totalReward: ${totalReward}`
  );
}

// Deposit some tokens
async function depositTest(
  account: Account,
  token: ERC20Token,
  stakingV1: StakingV1,
  amount: number
) {
  console.log("==== deposit ====");
  const erc20Before = await token.balanceOf(account.address);
  const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20Before:",
    erc20Before,
    " depositedAmountBefore:",
    depositedAmountBefore,
    "totalRewardsBefore",
    totalRewardsBefore
  );

  const depositAmount = BigInt(amount) * ONE_ETHER;
  await stakingV1.deposit(depositAmount.toString(), { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20After:",
    erc20After,
    " depositedAmountAfter:",
    depositedAmountAfter,
    "totalRewardsAfter",
    totalRewardsAfter
  );

  const expectedErc = erc20Before.valueOf() - depositAmount;
  ensure(
    erc20After == expectedErc,
    `invalid erc20 balance, expected ${expectedErc}, actual: ${erc20After}`
  );
  ensure(
    depositedAmountAfter > depositedAmountBefore,
    "invalid deposit balance"
  );
  console.log("==== deposit ====");
}

// WithDraw some tokens
async function withdrawTest(
  account: Account,
  token: ERC20Token,
  stakingV1: StakingV1,
  amount: number
) {
  console.log("==== withdraw ====");
  const erc20Before = await token.balanceOf(account.address);
  const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20Before:",
    erc20Before,
    " depositedAmountBefore:",
    depositedAmountBefore,
    "totalRewardsBefore",
    totalRewardsBefore
  );

  const withdrawAmount = BigInt(amount) * ONE_ETHER;
  await stakingV1.withdraw(withdrawAmount.toString(), { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20After:",
    erc20After,
    " depositedAmountAfter:",
    depositedAmountAfter,
    "totalRewardsAfter",
    totalRewardsAfter
  );

  const expectedDepositedAmount =
    depositedAmountBefore.valueOf() - withdrawAmount;
  ensure(
    depositedAmountAfter == expectedDepositedAmount,
    `invalid depositedAmount, expected ${expectedDepositedAmount}, actual: ${depositedAmountAfter}`
  );
  ensure(
    depositedAmountAfter <= depositedAmountBefore,
    "invalid deposit balance"
  );
  console.log("==== withdraw ====");
}

// WithDraw all tokens
async function withdrawAllTest(
  account: Account,
  token: ERC20Token,
  stakingV1: StakingV1
) {
  console.log("==== withdrawAll ====");
  const erc20Before = await token.balanceOf(account.address);
  const [depositedAmountBefore, totalRewardsBefore] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20Before:",
    erc20Before,
    " depositedAmountBefore:",
    depositedAmountBefore,
    "totalRewardsBefore",
    totalRewardsBefore
  );

  await stakingV1.withdrawAll({ confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const [depositedAmountAfter, totalRewardsAfter] = await stakingV1.stakeOf(
    account.address
  );
  console.log(
    "erc20After:",
    erc20After,
    " depositedAmountAfter:",
    depositedAmountAfter,
    "totalRewardsAfter",
    totalRewardsAfter
  );

  ensure(
    depositedAmountAfter.valueOf() == BigInt(0) &&
      totalRewardsAfter.valueOf() == BigInt(0),
    `invalid deposit balance,  expected: 0, actual: ${depositedAmountAfter},  expected: 0, actual: ${totalRewardsAfter}`
  );
  console.log("==== withdrawAll ====");
}

main()
  .then(() => exit(0))
  .catch((e) => {
    console.log(e);
    exit(1);
  });
