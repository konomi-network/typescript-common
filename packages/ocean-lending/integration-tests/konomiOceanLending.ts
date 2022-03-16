import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { KonomiOceanLending } from '../src/clients/konomiOceanLending';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../src/utils';

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
    
  
    it('key flow test',async () => {
       expect((await konomiOceanLending.activePoolIds()).length).to.equal(0);
    //    await konomiOceanLending.suspend(1, false, { confirmations: 3 });
    //    await konomiOceanLending.extendLease(1, BigInt(3600), { confirmations: 3 });
    });
});