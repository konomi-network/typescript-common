import { exit } from 'process';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../src/clients/erc20Token';
import { OToken } from '../src/clients/oToken';
import { Comptroller } from '../src/clients/comptroller';
import { PriceOracle } from '../src/clients/priceOracle';
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../src/utils';

async function liquidationIncentive(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
	console.log('==== liquidationIncentive ====');
	const erc20Before = await token.balanceOf(account.address);
	const oTokenBefore = await oToken.balanceOf(account.address);
	const incentive = await comptroller.liquidationIncentive();
	console.log('erc20:', erc20Before, ' oToken', oTokenBefore, 'incentive:', incentive);
	console.log('==== liquidationIncentive ====');
}

async function collateralFactor(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
	console.log('==== collateralFactor ====');
	const erc20Before = await token.balanceOf(account.address);
	const oTokenBefore = await oToken.balanceOf(account.address);
	const factor = await comptroller.collateralFactor(account.address);
	console.log(`erc20: ${erc20Before}, oToken: ${oTokenBefore}, collateralFactor: ${factor}%`);
	console.log('==== collateralFactor ====');
}

/**
 * The percent, ranging from 0% to 100%, of a liquidatable account's borrow that can be repaid in a single liquidate transaction.
 */
async function closeFactor(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller) {
	console.log('==== closeFactor ====');
	const erc20Before = await token.balanceOf(account.address);
	const oTokenBefore = await oToken.balanceOf(account.address);
	const factor = await comptroller.closeFactor(account.address);
	console.log(`erc20: ${erc20Before}, oToken: ${oTokenBefore}, closeFactor: ${factor}%`);
	console.log('==== closeFactor ====');
}

async function main() {
	// const config = readJsonSync('./config/config.json');
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

	// load the erc20 token object
	const erc20Abi = readJsonSync('./config/erc20.json');
	const erc20Token = new ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);

	const comptrollerAbi = readJsonSync('./config/comptroller.json');
	const comptroller = new Comptroller(web3, comptrollerAbi, oToken.parameters.comptroller, account);

	// load price feed object
	// const priceOracleAbi = readJsonSync("./config/priceOracle.json");
	// const priceOracle = new PriceOracle(
	//   web3,
	//   priceOracleAbi,
	//   config.priceOracle,
	//   account
	// );

	// actual tests
	await liquidationIncentive(account, oToken, erc20Token, comptroller);
	await collateralFactor(account, oToken, erc20Token, comptroller);
	await closeFactor(account, oToken, erc20Token, comptroller);
}

main();
