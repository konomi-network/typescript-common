import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { Comptroller } from '../comptroller';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../utils';

async function enterMarkets(account: Account, markets: string[], comptroller: Comptroller) {
	console.log('==== enterMarkets ====');
	await comptroller.enterMarkets(markets, { confirmations: 3 });

	const liquidity = await comptroller.getAccountLiquidity(account.address);
	console.log(`You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);

	ensure(liquidity > 0, `You don't have any liquid assets pooled in the protocol.`);

	const collateralFactor = await comptroller.markets(markets[0]);
	ensure(collateralFactor > 0, 'You dont have any collateral assets');
	console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as oETH.`);
}

async function borrow(account: Account, oToken: OToken, token: ERC20Token) {
	console.log('==== borrow ====');
	const ethBefore = await token.balanceOf(account.address);
	const oTokenBefore = await oToken.balanceOf(account.address);

	ensure(oTokenBefore > BigInt(0), "You don't have any oToken as collateral");
	console.log('ethBefore:', ethBefore, ' oTokenBefore:', oTokenBefore);

	const underlyingToBorrow = 50;
	const underlyingDecimals = 18;
	const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
	await oToken.borrow(scaledUpBorrowAmount, { confirmations: 3 });

	const balance = await oToken.borrowBalanceCurrent(account.address);
	console.log(`Borrow balance is ${balance / Math.pow(10, underlyingDecimals)}`);

	await oToken.approve(scaledUpBorrowAmount, { confirmations: 3 });

	const ethAfter = await token.balanceOf(account.address);
	const oTokenAfter = await oToken.balanceOf(account.address);

	console.log('ethAfter:', ethAfter, ' oTokenAfter:', oTokenAfter);

	ensure(ethAfter > ethBefore, `invalid eth balance, expected ${ethBefore}, actual: ${ethAfter}`);

	ensure(oTokenAfter === oTokenBefore, 'invalid borrow balance');
	// oToken.convertFromUnderlying(amount);
}

async function repayBorrow(account: Account, oToken: OToken, token: ERC20Token) {
	console.log('==== repayBorrow ====');
	const erc20Before = await token.balanceOf(account.address);
	const oTokenBefore = await oToken.balanceOf(account.address);

	console.log('erc20Before:', erc20Before, ' oTokenBefore:', oTokenBefore);

	await oToken.repayBorrow(oTokenBefore, { confirmations: 3 });

	const erc20After = await token.balanceOf(account.address);
	const oTokenAfter = await oToken.balanceOf(account.address);

	console.log('erc20After:', erc20After, ' oTokenAfter:', oTokenAfter);

	ensure(erc20Before > erc20After, `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`);
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
	const oTokenAbi = readJsonSync('./config/oToken.json');
	const oToken = new OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);

	// load the eth object
	const ethAbi = readJsonSync('./config/erc20.json');
	const ethToken = new ERC20Token(web3, ethAbi, oToken.parameters.underlying, account);

	const comptrollerAbi = readJsonSync('./config/comptroller.json');
	const comptroller = new Comptroller(web3, comptrollerAbi, oToken.parameters.comptroller, account);

	// actual tests
	const markets = [config.oTokens.oKono.address];
	await enterMarkets(account, markets, comptroller);
	await borrow(account, oToken, ethToken);
	// await repayBorrow(account, oToken, erc20Token);
}

main()
	.then(() => exit(0))
	.catch((e) => {
		console.log(e);
		exit(1);
	});
