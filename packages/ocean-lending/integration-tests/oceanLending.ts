import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import {ONE_ETHER} from '../src/utils';
import {loadWalletFromEncyrptedJson, loadWalletFromPrivate,readJsonSync, readPassword} from "../src/reading";
import { Address, Uint16 } from '../src/types';
import { InterestConfig } from '../src/config';
import logger from '../src/logger';
import Comptroller from '../src/clients/comptroller';
import PriceOracleAdaptor from '../src/clients/priceOracle';
import OToken from '../src/clients/oToken';
import JumpInterestV2 from '../src/clients/jumpInterestV2';
import OceanLending from '../src/clients/oceanLending';

describe('OceanLending', async () => {
  const config = readJsonSync('./config/config.json');
  const oceanLendingAbi = readJsonSync('./config/konomiOceanLending.json');
  const oTokenAbi = readJsonSync('./config/oToken.json');
  const comptrollerAbi = readJsonSync('./config/comptroller.json');
  const jumpInterestV2Abi = readJsonSync('./config/jumpInterestV2.json');
  const priceOracleAbi = readJsonSync('./config/priceOracle.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oceanLending: OceanLending;
  let comptroller: Comptroller;
  let jumpInterestV2: JumpInterestV2;
  let priceOracle: PriceOracleAdaptor;

  let poolId = 0;
  const leasePeriod = BigInt(2589570);

  before(async () => {
    if (config.encryptedAccountJson) {
      const pw = await readPassword();
      account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
      account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
      throw Error('Cannot setup account');
    }

    console.log('Using account:', account);

    // load the konomiOceanLending object
    oceanLending = new OceanLending(web3, oceanLendingAbi, config.konomiOceanLending.address, account);
  });

  it('create pool works', async () => {
    let activePoolIds = await getAllActivePoolIds();
    console.log('activePoolIds:', activePoolIds);

    poolId = await oceanLending.nextPoolId();
    console.log('nextPoolId: ', poolId);

    await makePool(leasePeriod);

    const pool = await oceanLending.getPoolById(poolId);
    console.log('pool.deployContract: ', pool.deployContract, 'suspended:', pool.suspended);

    // check compound params
    const markets = await getAllMarkets(pool.deployContract);
    const blockTime = 15;

    for (const marketAddress of markets) {
      console.log('==== oTokenAddress: ', marketAddress);
      const oToken = await makeOToken(marketAddress);
      const JumpInterestV2Address = await oToken.interestRateModel();
      console.log(`JumpInterestV2Address: ${JumpInterestV2Address}`);

      jumpInterestV2 = new JumpInterestV2(web3, jumpInterestV2Abi, JumpInterestV2Address, account);
      const baseRatePerYear = await jumpInterestV2.baseRatePerYear();
      const multiplierPerYear = await jumpInterestV2.multiplierPerYear();
      const jumpMultiplierPerYear = await jumpInterestV2.jumpMultiplierPerYear();
      const kink = await jumpInterestV2.kink();
      console.log(`baseRatePerYear: ${Number(baseRatePerYear) / 1e18}`);
      console.log(`multiplierPerYear: ${Number(multiplierPerYear) / 1e18}`);
      console.log(`jumpMultiplierPerYear: ${Number(jumpMultiplierPerYear) / 1e18}`);
      console.log(`kink: ${Number(kink) / 1e18}`);
      
      const incentive = await comptroller.liquidationIncentive();
      const closeFactor = await comptroller.closeFactor();
      const oTokenCollateralFactor = await comptroller.collateralFactor(marketAddress);
      console.log(`incentive: ${incentive}`);
      console.log(`closeFactor: ${closeFactor}`);
      console.log(`oTokenCollateralFactor: ${oTokenCollateralFactor}`);
    }
  });

  it('testComptroller', async () => {
    const activePoolIds = await getAllActivePoolIds();
    console.log('activePoolIds:', activePoolIds);

    const pool = await oceanLending.getPoolById(poolId);
    console.log('pool.deployContract: ', pool.deployContract, 'suspended:', pool.suspended);

    const markets = await getAllMarkets(pool.deployContract);
    const blockTime = 15;

    for (const marketAddress of markets) {
      console.log('==== oTokenAddress: ', marketAddress);
      const oToken = await makeOToken(marketAddress);

      await testMint(oToken);
      await displayOTokenInfo(oToken);
      await displayComptrollerInfo();
      await testRedeem(oToken);

      // await testBorrow(oToken);
    }
  });

  it ('testSuspend', async () => {
    await testSuspend(poolId, true);
    await testSuspend(poolId, true);
    await testSuspend(poolId, false);
  });

  it ('testExtendLease', async () => {
    await testSuspend(poolId, true);
    await testExtendLease(poolId, leasePeriod);

    await testSuspend(poolId, false);
    await testExtendLease(poolId, leasePeriod);
  });

  it ('testNotExistsPool', async () => {
    await testNotExistsPool();
  });

  async function getAllMarkets(comptrollerAddress: string): Promise<string[]> {
    comptroller = new Comptroller(web3, comptrollerAbi, comptrollerAddress, account);

    const oracleAddress = await comptroller.oracleAddress();
    console.log('comptroller address:', comptroller.address);
    console.log('oracleAddress:', oracleAddress);
    expect(oracleAddress).to.a('string');

    priceOracle = new PriceOracleAdaptor(web3, priceOracleAbi, oracleAddress, account);

    return  await comptroller.allMarkets();
  }

  async function makeOToken(oTokenAddress: string): Promise<OToken> {
    return new OToken(web3, oTokenAbi, oTokenAddress, account, config.oTokens.oKono.parameters);
  }

  async function displayComptrollerInfo() {
    const incentive = await comptroller.liquidationIncentive();
    console.log('incentive:', incentive);

    const closeFactor = await comptroller.closeFactor();
    console.log('closeFactor:', closeFactor);
  }

  async function testMint(oToken: OToken) {
    const oTokenBefore = await oToken.balanceOf(account.address);
    console.log('oTokenBefore:', oTokenBefore);

    const depositAmount = BigInt(1000) * ONE_ETHER;
    await oToken.mint(depositAmount.toString(), { confirmations: 3 });

    const oTokenAfter = await oToken.balanceOf(account.address);
    console.log('oTokenAfter:', oTokenAfter);
  }

  async function testRedeem(oToken: OToken) {
    const oTokenBefore = await oToken.balanceOf(account.address);
    console.log('oTokenBefore:', oTokenBefore);

    await oToken.redeem(oTokenBefore.toString(), { confirmations: 3 });

    const oTokenAfter = await oToken.balanceOf(account.address);
    console.log('oTokenAfter:', oTokenAfter);
  }

  async function displayOTokenInfo(oToken: OToken) {
    const liquidity: number = await comptroller.getAccountLiquidity(account.address);
    console.log(`You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);

    const oTokenBefore = await oToken.balanceOf(account.address);
    const borrowBalanceBefore = await oToken.borrowBalanceCurrent(account.address);
    const oTokenCollateralFactor = await comptroller.collateralFactor(oToken.address);
    const exchangeRate = await oToken.exchangeRate();
    const underlyingPrice = await priceOracle.getUnderlyingPrice(oToken.address);
    const underlyingDeposited = (Number(oTokenBefore) / Math.pow(10, oToken.parameters.decimals)) * +exchangeRate;
    const underlyingBorrowable = (underlyingDeposited * oTokenCollateralFactor) / 100;

    console.log('oTokenBefore:', oTokenBefore);
    console.log(`exchangeRate: ${+exchangeRate / 1e28}`);
    console.log(`underlyingPrice: ${(+underlyingPrice).toFixed(6)} USD`);
    console.log(`borrowBalanceBefore: ${borrowBalanceBefore}`);
    console.log(`oTokenCollateralFactor: ${oTokenCollateralFactor}`);
    console.log(`underlyingDeposited: ${underlyingDeposited}`);
    console.log(`underlyingBorrowable: ${underlyingBorrowable}`);
    console.log('NEVER borrow near the maximum amount because your account will be instantly liquidated.');
    expect(+borrowBalanceBefore <= underlyingBorrowable).to.true;
  }

  async function testBorrow(oToken: OToken) {
    const oTokenBefore = await oToken.balanceOf(account.address);

    const underlyingDecimals = 18;
    const underlyingToBorrow = 50;
    const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
    await oToken.borrow(scaledUpBorrowAmount.toString(), { confirmations: 3 });

    const borrowBalanceAfter = await oToken.borrowBalanceCurrent(account.address);
    console.log(`Borrow balance after is ${+borrowBalanceAfter / Math.pow(10, underlyingDecimals)}`);

    await oToken.approve(scaledUpBorrowAmount.toString(), { confirmations: 3 });

    const oTokenAfter = await oToken.balanceOf(account.address);
    console.log('oTokenAfter:', oTokenAfter);
    expect(oTokenAfter == oTokenBefore).to.true;
  }

  async function makePool(leasePeriod: BigInt): Promise<number> {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint16(1),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
      }
    };
    const t2 = {
      underlying: Address.fromString('0x30cDBa5e339881c707E140A5E7fe27fE1835d0dA'),
      subscriptionId: new Uint16(1),
      interest: new InterestConfig(
        new Uint16(10001), // baseRatePerYear
        new Uint16(20002), // multiplierPerYear
        new Uint16(30003), // jumpMultiplierPerYear
        new Uint16(40005) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(2001),
      }
    };
    const t3 = {
      underlying: Address.fromString('0x6Ed700f5b9F8A8c62419209b298Bd6080fC9ABC6'),
      subscriptionId: new Uint16(1),
      interest: new InterestConfig(
        new Uint16(2001), // baseRatePerYear
        new Uint16(3002), // multiplierPerYear
        new Uint16(4003), // jumpMultiplierPerYear
        new Uint16(5005) // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(1001),
        
      }
    };
    const poolConfig = {
      liquidationIncentive: new Uint16(1080),
      closeFactor: new Uint16(2002),
      tokens: [t1, t2, t3]
    };
    
    expect(await oceanLending.derivePayable(leasePeriod)).to.equal('20017376100000000000000');
    // await oceanLending.grantInvokerRole(account.address, { confirmations: 3 });

    expect(await oceanLending.create(poolConfig, BigInt(1), account.address, { confirmations: 3 })
      .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-1');

    await oceanLending.create(poolConfig, leasePeriod, account.address, { confirmations: 3 });
    return await oceanLending.nextPoolId();
  }

  async function getAllActivePoolIds(): Promise<number[]> {
    const activePoolIds = await oceanLending.activePoolIds();
    let ids = [];
    for (const poolId of activePoolIds) {
      const id = Number(poolId);
      ids.push(id);
      const pool = await oceanLending.getPoolById(id);
      logger.info('poolId: %s pool: %s', poolId, pool);
    }
    return ids;
  }

  async function testNotExistsPool() {
    const poolId = 1000000000000000;
    const pool = await oceanLending.getPoolById(poolId);
    expect(pool.suspended).to.false;
    expect(pool.leaseStart).to.equal('0');
    expect(pool.leaseEnd).to.equal('0');
  }

  async function testSuspend(poolId: number, suspend: boolean) {
    let pool = await oceanLending.getPoolById(poolId);
    if (pool.suspended == suspend) {
      expect(await oceanLending.suspend(poolId, suspend, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-3');
    } else {
      await oceanLending.suspend(poolId, suspend, { confirmations: 3 });
      const pool = await oceanLending.getPoolById(poolId);
      expect(pool.suspended == suspend).to.true;
    }
  }

  async function testExtendLease(poolId: number, leasePeriod: BigInt) {
    let pool = await oceanLending.getPoolById(poolId);
    const oldLeaseEnd = pool.leaseEnd;
    if (pool.suspended) {
      expect(await oceanLending.extendLease(poolId, leasePeriod, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-4');
    } else if (pool.owner == account.address) {
      await oceanLending.extendLease(poolId, leasePeriod, { confirmations: 3 });
      pool = await oceanLending.getPoolById(poolId);
      expect(pool.leaseEnd > oldLeaseEnd).to.true;
    }
  }
});