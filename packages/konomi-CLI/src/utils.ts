import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/erc20Token';
import { OToken } from '../../ocean-lending/src/oToken';
import { Comptroller } from '../../ocean-lending/src/comptroller';
import { loadWalletFromEncyrptedJson, loadWalletFromPrivate, readJsonSync, readPassword } from '../../ocean-lending/src/utils';
import { PriceOracle } from '../../ocean-lending/src/priceOracle'

/**
 * The OceanLeningHandler class for CLI's  OceanLending command .
 */
export async function parseOceanLeningConfiguration(configPath: string) {
    const config = readJsonSync(configPath);

    const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

    let account: Account;
    if (config.encryptedAccountJson) {
        const pw = await readPassword();
        account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
        account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
        throw Error("Cannot setup account");
    }

    console.log("Using account:", account.address);

    // load the oToken object
    const oTokenAbi = readJsonSync('../ocean-lending/config/oToken.json');
    const oToken = new OToken(
        web3,
        oTokenAbi,
        config.oTokens.oKono.address,
        account,
        config.oTokens.oKono.parameters
    );

    // load the erc20 token object
    const erc20Abi = readJsonSync('../ocean-lending/config/erc20.json');
    const token = new ERC20Token(
        web3,
        erc20Abi,
        oToken.parameters.underlying,
        account
    );

    const comptrollerAbi = readJsonSync('../ocean-lending/config/comptroller.json');
    const comptroller = new Comptroller(
        web3,
        comptrollerAbi,
        oToken.parameters.comptroller,
        account
    );

    // load price feed object
    const priceOracleAbi = readJsonSync('../ocean-lending/config/priceOracle.json');
    const priceOracle = new PriceOracle(web3, priceOracleAbi, config.priceOracle, account);

    return [account, oToken, token, comptroller, config, priceOracle] as const;
}