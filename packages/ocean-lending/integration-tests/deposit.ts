import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../src/clients/erc20Token';
import { OToken } from '../src/clients/oToken';
import {
  ensure,
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  ONE_ETHER,
  readJsonSync,
  readPassword
} from '../src/utils';

async function depositWorks(account: Account, oToken: OToken, token: ERC20Token) {
  console.log('==== deposit ====');
  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);

  console.log('erc20Before:', erc20Before, ' oTokenBefore:', oTokenBefore);

  const depositAmount = BigInt(1000) * ONE_ETHER;
  await oToken.mint(depositAmount, { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  console.log('erc20After:', erc20After, ' oTokenAfter:', oTokenAfter);

  const expectedErc = erc20Before.valueOf() - depositAmount;
  ensure(erc20After == expectedErc, `invalid erc20 balance, expected ${expectedErc}, actual: ${erc20After}`);

  ensure(oTokenAfter > oTokenBefore, 'invalid deposit balance');
  // oToken.convertFromUnderlying(amount);
  expect(oTokenAfter > oTokenBefore).to.be.eq(true);
}

/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
async function redeemNoBorrow(account: Account, oToken: OToken, token: ERC20Token) {
  console.log('==== redeem ====');

  const erc20Before = await token.balanceOf(account.address);
  const oTokenBefore = await oToken.balanceOf(account.address);
  console.log('oToken minted: ', Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals));
  console.log('oToken to redeem: ', Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals));

  await oToken.redeem(oTokenBefore, { confirmations: 3 });

  const erc20After = await token.balanceOf(account.address);
  const oTokenAfter = await oToken.balanceOf(account.address);

  ensure(
    erc20Before < erc20After,
    `invalid erc20 balance, expected erc20After ${Number(erc20After) / 1e18} to be bigger than actual: ${
      Number(erc20After) / 1e18
    }`
  );
  ensure(oTokenAfter.valueOf() === BigInt(0), 'invalid deposit balance');
  // oToken.convertFromUnderlying(amount);
}

describe('Deposit', async () => {
  const config = readJsonSync('./config/config.json');
  const oTokenAbi = readJsonSync('./config/oToken.json');
  const erc20Abi = readJsonSync('./config/erc20.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oToken: OToken;
  let erc20Token: ERC20Token;

  before(async () => {
    if (config.encryptedAccountJson) {
      const pw = await readPassword();
      account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
      account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
      throw Error('Cannot setup account');
    }

    console.log('Using account:', account.address);

    // load the oToken object
    oToken = new OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);

    // load the erc20 token object
    erc20Token = new ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);
  });

  it('key flow test', async () => {
    await depositWorks(account, oToken, erc20Token);
    await redeemNoBorrow(account, oToken, erc20Token);
  });
});
