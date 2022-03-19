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
    //  expect((await konomiOceanLending.activePoolIds()).length).to.equal(0);

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


    const activePoolIds = await konomiOceanLending.activePoolIds();
    activePoolIds.forEach(async (poolId) => {
      const pool = await konomiOceanLending.getPoolById(Number(poolId));
      logger.info('poolId: %s pool: %s', poolId, pool);
    })

    const nextPoolId = await konomiOceanLending.nextPoolId();
    console.log('activePoolIds:', activePoolIds);
    console.log('nextPoolId: ', nextPoolId);

    const leasePeriod = BigInt(3600);
    expect(await konomiOceanLending.derivePayable(leasePeriod)).to.equal('27828000000000000000');
    // await konomiOceanLending.grantInvokerRole(account.address, { confirmations: 3 });

    // await konomiOceanLending.create(poolConfig, leasePeriod, account.address, { confirmations: 3 });
    // console.log('nextPoolId: ', await konomiOceanLending.nextPoolId());

    // test suspend and extendLease
    let poolId = 0;
    let pool = await konomiOceanLending.getPoolById(poolId);
    if (pool.suspended) {
      expect(await konomiOceanLending.suspend(poolId, true, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-3');
    
      expect(await konomiOceanLending.extendLease(poolId, leasePeriod, { confirmations: 3 })
        .catch((error: Error) => error.message)).to.equal('Returned error: execution reverted: KON-SUB-4');
    } else {
      await konomiOceanLending.suspend(poolId, true, { confirmations: 3 });
      const pool = await konomiOceanLending.getPoolById(poolId);
      expect(pool.suspended).to.true;
    }

    // test not exists pool
    poolId = 1000000000000000;
    pool = await konomiOceanLending.getPoolById(poolId);
    expect(pool.suspended).to.false;
    expect(pool.leaseStart).to.equal('0');
    expect(pool.leaseEnd).to.equal('0');
  });
});