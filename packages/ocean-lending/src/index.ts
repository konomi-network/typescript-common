import Web3 from 'web3';
import { Account } from 'web3-core';
import { OToken } from './oToken';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from './utils';

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

	const oTokenAbi = readJsonSync('./config/oToken.json');
	const oToken = new OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);

	const amount = BigInt(1000) * ONE_ETHER;
	await oToken.mint(amount, { confirmations: 3 });
	const balance = await oToken.balanceOf(account.address);
	console.log('amount: ', amount, ' balance:', balance);
}

main();
