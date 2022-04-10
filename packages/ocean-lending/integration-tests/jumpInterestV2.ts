import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { JumpInterestV2 } from '../src/clients/jumpInterestV2';
import { OToken } from '../src/clients/oToken';
import { ONE_ETHER } from '../src/utils';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from "../src/reading"

async function blocksPerYear(jumpInterestV2: JumpInterestV2) {
  console.log('==== blocksPerYear ====');
  const blocks = await jumpInterestV2.blocksPerYear();
  console.log(`blocksPerYear: ${blocks}`);
  console.log('==== blocksPerYear ====');
}

async function multiplierPerYear(jumpInterestV2: JumpInterestV2) {
  console.log('==== multiplierPerYear ====');
  const multiplier = await jumpInterestV2.multiplierPerYear();
  console.log(`multiplierPerYear: ${multiplier}`);
  console.log('==== multiplierPerYear ====');
}

async function baseRatePerYear(jumpInterestV2: JumpInterestV2) {
  console.log('==== baseRatePerYear ====');
  const rate = await jumpInterestV2.baseRatePerYear();
  console.log(`baseRatePerYear: ${rate.valueOf()}`);
  console.log('==== baseRatePerYear ====');
}

async function jumpMultiplierPerYear(jumpInterestV2: JumpInterestV2) {
  console.log('==== jumpMultiplierPerYear ====');
  const jumpMultiplier = await jumpInterestV2.jumpMultiplierPerYear();
  console.log(`jumpMultiplierPerYear: ${jumpMultiplier}`);
  console.log('==== jumpMultiplierPerYear ====');
}

async function kink(jumpInterestV2: JumpInterestV2) {
  console.log('==== kink ====');
  const rate = await jumpInterestV2.kink();
  console.log(`kink: ${rate}`);
  console.log('==== kink ====');
}

async function getBorrowRate(jumpInterestV2: JumpInterestV2, oToken: OToken) {
  console.log('==== getBorrowRate ====');
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves()
  ]);
  const rate = await jumpInterestV2.getBorrowRateByOToken(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, borrowRate: ${rate
    }`
  );
  console.log('==== getBorrowRate ====');
  expect(totalReserves).to.be.eq(BigInt(0));
}

async function getSupplyRate(jumpInterestV2: JumpInterestV2, oToken: OToken, reserveFactorMantissa: BigInt) {
  console.log('==== getSupplyRate ====');
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves()
  ]);
  const rate = await jumpInterestV2.getSupplyRateByOToken(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, reserveFactorMantissa: ${reserveFactorMantissa} supplyRate: ${rate
    }`
  );
  console.log('==== getSupplyRate ====');
  expect(totalReserves).to.be.eq(BigInt(0));
}

async function getBorrowRateAPY(jumpInterestV2: JumpInterestV2, oToken: OToken) {
  console.log('==== getBorrowRateAPY ====');
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves()
  ]);
  const rate = await jumpInterestV2.getBorrowRateAPY(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, BorrowRateAPY: ${rate
    }`
  );
  console.log('==== getBorrowRateAPY ====');
  expect(totalReserves).to.be.eq(BigInt(0));
}

async function getSupplyRateAPY(jumpInterestV2: JumpInterestV2, oToken: OToken) {
  console.log('==== getSupplyRateAPY ====');
  const [cash, totalBorrows, totalReserves] = await Promise.all([
    oToken.getCash(),
    oToken.totalBorrowsCurrent(),
    oToken.totalReserves()
  ]);
  const rate = await jumpInterestV2.getSupplyRateAPY(oToken);
  console.log(
    `cash: ${cash}, totalBorrows: ${totalBorrows}, totalReserves: ${totalReserves}, supplyRateAPY: ${rate
    }`
  );
  console.log('==== getSupplyRateAPY ====');
  expect(totalReserves).to.be.eq(BigInt(0));
}

describe('JumpInterestV2', () => {
  const config = readJsonSync('./config/config.json');
  const oTokenAbi = readJsonSync('./config/oToken.json');
  const jumpInterestV2Abi = readJsonSync('./config/jumpInterestV2.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oToken: OToken;
  let jumpInterestV2: JumpInterestV2;

  beforeAll(async () => {
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

    // load JumpInterestV2 object
    jumpInterestV2 = new JumpInterestV2(web3, jumpInterestV2Abi, config.jumpInterestV2.address, account);
  });

  it('key flow test', async () => {
    const blockTime = 15;
    const cash = await oToken.getCash();
    const totalBorrows = await oToken.totalBorrowsCurrent();
    const totalSupply = await oToken.totalSupply();
    const totalReserves = await oToken.totalReserves();
    const reserveFactorMantissa = await oToken.reserveFactorMantissa();
    console.log(
      `cash: ${cash}, totalBorrows: ${totalBorrows}, totalSupply: ${totalSupply}, reserveFactorMantissa: ${reserveFactorMantissa}, totalReserves: ${totalReserves}`
    );

    await blocksPerYear(jumpInterestV2);
    await multiplierPerYear(jumpInterestV2);
    await baseRatePerYear(jumpInterestV2);
    await jumpMultiplierPerYear(jumpInterestV2);
    await kink(jumpInterestV2);

    await getBorrowRate(jumpInterestV2, oToken);
    await getBorrowRateAPY(jumpInterestV2, oToken);
    await getSupplyRate(jumpInterestV2, oToken, reserveFactorMantissa);
    await getSupplyRateAPY(jumpInterestV2, oToken);
  });
});
