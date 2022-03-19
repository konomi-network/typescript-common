import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { KonomiOceanLending } from '../src/clients/konomiOceanLending';
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword
} from '../src/utils';
import { Address, Uint16, Uint64 } from '../src/types';
import { InterestConfig } from '../src/config';
import logger from '../src/logger';

describe('KonomiOceanLending', async () => {
  const config = readJsonSync('./config/config.json');
  const konomiOceanLendingAbi = readJsonSync('./config/konomiOceanLending.json');
  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let konomiOceanLending: KonomiOceanLending;

  let poolId = 0;
  const leasePeriod = BigInt(3600);

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
    konomiOceanLending = new KonomiOceanLending(web3, konomiOceanLendingAbi, config.konomiOceanLending.address, account);
  });


  it('create pool works', async () => {
    let activePoolIds = await getAllActivePoolIds();
    console.log('activePoolIds:', activePoolIds);

    poolId = await konomiOceanLending.nextPoolId();
    console.log('nextPoolId: ', poolId);

    poolId = await createPool(leasePeriod);
    console.log('createPool nextPoolId: ', poolId);
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

  async function createPool(leasePeriod: BigInt): Promise<number> {
    const t1 = {
      underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4004) // kink
      ),
      collateral: {
        canBeCollateral: true,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const t2 = {
      underlying: Address.fromString('0x30cDBa5e339881c707E140A5E7fe27fE1835d0dA'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4005) // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const t3 = {
      underlying: Address.fromString('0x6Ed700f5b9F8A8c62419209b298Bd6080fC9ABC6'),
      subscriptionId: new Uint64(BigInt(1)),
      interest: new InterestConfig(
        new Uint16(1001), // baseRatePerYear
        new Uint16(2002), // multiplierPerYear
        new Uint16(3003), // jumpMultiplierPerYear
        new Uint16(4005) // kink
      ),
      collateral: {
        canBeCollateral: false,
        collateralFactor: new Uint16(1001),
        liquidationIncentive: new Uint16(2)
      }
    };
    const poolConfig = {
      tokens: [t1, t2, t3]
    };
    
    expect(await konomiOceanLending.derivePayable(leasePeriod)).to.equal('27828000000000000000');
    // await konomiOceanLending.grantInvokerRole(account.address, { confirmations: 3 });

    expect(await konomiOceanLending.create(poolConfig, leasePeriod, account.address, { confirmations: 3 })
      .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-1');
    return await konomiOceanLending.nextPoolId();
  }

  async function getAllActivePoolIds(): Promise<number[]> {
    const activePoolIds = await konomiOceanLending.activePoolIds();
    let ids = [];
    for (const poolId of activePoolIds) {
      const id = Number(poolId);
      ids.push(id);
      const pool = await konomiOceanLending.getPoolById(id);
      logger.info('poolId: %s pool: %s', poolId, pool);
    }
    return ids;
  }

  async function testNotExistsPool() {
    const poolId = 1000000000000000;
    const pool = await konomiOceanLending.getPoolById(poolId);
    expect(pool.suspended).to.false;
    expect(pool.leaseStart).to.equal('0');
    expect(pool.leaseEnd).to.equal('0');
  }

  async function testSuspend(poolId: number, suspend: boolean) {
    let pool = await konomiOceanLending.getPoolById(poolId);
    if (pool.suspended == suspend) {
      expect(await konomiOceanLending.suspend(poolId, suspend, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-3');
    } else {
      await konomiOceanLending.suspend(poolId, suspend, { confirmations: 3 });
      const pool = await konomiOceanLending.getPoolById(poolId);
      expect(pool.suspended == suspend).to.true;
    }
  }

  async function testExtendLease(poolId: number, leasePeriod: BigInt) {
    let pool = await konomiOceanLending.getPoolById(poolId);
    const oldLeaseEnd = pool.leaseEnd;
    if (pool.suspended) {
      expect(await konomiOceanLending.extendLease(poolId, leasePeriod, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-4');
    } else if (pool.owner == account.address) {
      await konomiOceanLending.extendLease(poolId, leasePeriod, { confirmations: 3 });
      pool = await konomiOceanLending.getPoolById(poolId);
      expect(pool.leaseEnd > oldLeaseEnd).to.true;
    }
  }
});