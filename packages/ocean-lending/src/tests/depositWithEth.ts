import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../utils';

async function depositWorks(account: Account, oToken: OToken, token: ERC20Token) {
	console.log('==== depositWorks ====');
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
}

/**
 * Deposit then withdraw when no borrowing or collateral in place
 */
async function redeemNoBorrow(account: Account, oToken: OToken, token: ERC20Token) {
	console.log('==== redeemNoBorrow ====');
	const amount = BigInt(1000) * ONE_ETHER;

	const ethBefore = await token.balanceOf(account.address);
	const oEthBefore = await oToken.balanceOf(account.address);

	await oToken.redeem(oEthBefore, { confirmations: 3 });

	const ethAfter = await token.balanceOf(account.address);
	const oEthAfter = await oToken.balanceOf(account.address);

	ensure(ethBefore < ethAfter, `invalid eth balance, expected ${ethAfter} to be bigger than actual: ${ethBefore}`);

	ensure(oEthAfter.valueOf() === BigInt(0), 'invalid deposit balance');
	// oToken.convertFromUnderlying(amount);
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

	// load the oToken object
	const oEthAbi = readJsonSync('./config/oToken.json');
	const oEth = new OToken(web3, oEthAbi, config.oTokens.oEth.address, account, config.oTokens.oEth.parameters);

	// load the erc20 token object
	const ethAbi = readJsonSync('./config/eth.json');
	const ethToken = new ERC20Token(web3, ethAbi, oEth.parameters.underlying, account);

	// actual tests
	await depositWorks(account, oEth, ethToken);
	// await redeemNoBorrow(account, oEth, ethToken);
}

main()
	.then(() => exit(0))
	.catch((e) => {
		console.log(e);
		exit(1);
	});
