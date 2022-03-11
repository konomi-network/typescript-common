import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { FeedFactory } from '../src/clients/feedFactory';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../src/utils';

async function getFeedWorks(client: FeedFactory, subscriptionIds: string[]): Promise<void> {
  await Promise.all(subscriptionIds.map((id) => client.getFeed(id)));
}

async function main() {
  const config = readJsonSync('./config/config.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error('Cannot setup account');
  }

  console.log('Using account:', account.address);

  const abi = readJsonSync('./config/feedFactory.json');
  const client = new FeedFactory(web3, abi, config.feedFactory.address, account);

  // actual tests
  // await client.feeds("0");
  console.log(await client.getFeed('0'));
  // await client.submit("0", 1, "200000000", { confirmations: 3 });
  await getFeedWorks(client, ['0', '1', '2']);
}

main()
  .then(() => exit(0))
  .catch((e) => {
    console.log(e);
    exit(1);
  });
