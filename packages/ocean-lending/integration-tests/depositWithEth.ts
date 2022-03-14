import { expect } from "chai";
import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "../src/clients/erc20Token";
import { OToken } from "../src/clients/oToken";
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  ONE_ETHER,
  readJsonSync,
  readPassword,
} from "../src/utils";

async function depositWorks(
  account: Account,
  oToken: OToken,
  token: ERC20Token
) {
  console.log("==== depositWorks ====");
  const ethBefore = await token.balanceOf(account.address);
  const oEthBefore = await oToken.balanceOf(account.address);

  console.log('ethBefore:', ethBefore, ' oEthBefore:', oEthBefore);

  const amount = BigInt(100) * ONE_ETHER;
  await oToken.mint(amount, { confirmations: 3 });

  const ethAfter = await token.balanceOf(account.address);
  const oEthAfter = await oToken.balanceOf(account.address);

  console.log('ethAfter:', ethAfter, ' oEthAfter:', oEthAfter);

  const expectedEth = ethBefore.valueOf() - amount;
  ensure(ethAfter == expectedEth, `invalid eth balance, expected ${expectedEth}, actual: ${ethAfter}`);

  ensure(oEthAfter > oEthBefore, 'invalid deposit balance');
  // oToken.convertFromUnderlying(amount);
  expect(oEthAfter > oEthBefore).to.be.eq(true);
}

/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
async function redeemNoBorrow(account: Account, oToken: OToken, token: ERC20Token) {
  console.log('==== redeemNoBorrow ====');
  // const amount = BigInt(1000) * ONE_ETHER;

  const ethBefore = await token.balanceOf(account.address);
  const oEthBefore = await oToken.balanceOf(account.address);

  await oToken.redeem(oEthBefore, { confirmations: 3 });

  const ethAfter = await token.balanceOf(account.address);
  const oEthAfter = await oToken.balanceOf(account.address);

  ensure(ethBefore < ethAfter, `invalid eth balance, expected ${ethAfter} to be bigger than actual: ${ethBefore}`);
  ensure(oEthAfter.valueOf() === BigInt(0), 'invalid deposit balance');

  console.log(`ethAfter balance is ${ethAfter}`);
  // oToken.convertFromUnderlying(amount);
  expect(oEthAfter.valueOf() === BigInt(0)).to.be.eq(true);
}

describe("DepositWithEth", async () => {
  const config = readJsonSync("./config/config.json");
  const oEthAbi = readJsonSync("./config/oToken.json");
  const ethAbi = readJsonSync("./config/erc20.json");

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oEth: OToken;
  let ethToken: ERC20Token;

  before(async () => {
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

    console.log("Using account:", account.address);

    // load the oToken object
    oEth = new OToken(
      web3,
      oEthAbi,
      config.oTokens.oKono.address,
      account,
      config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    ethToken = new ERC20Token(
      web3,
      ethAbi,
      oEth.parameters.underlying,
      account
    );
  });

  it("key flow test", async () => {
    await depositWorks(account, oEth, ethToken);
    await redeemNoBorrow(account, oEth, ethToken);
  });
});
