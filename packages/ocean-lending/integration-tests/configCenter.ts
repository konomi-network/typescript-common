import { expect } from 'chai';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ConfigCenter } from '../src/clients/configCenter';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../src/utils';

describe('ConfigCenter', async () => {
  const config = readJsonSync('./config/config.json');
  const abi = readJsonSync('./config/configCenter.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let client: ConfigCenter;

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

    client = new ConfigCenter(web3, abi, '0x3B6d7926FC8432ac38a9EC3F1DB24d3456169260', account);
  });

  it('feedTimeout', async () => {
    // await client.setFeedTimeout(2400, { confirmations: 3 });
    expect(await client.get('feedTimeout')).to.be.eq('2400');
  });
});
