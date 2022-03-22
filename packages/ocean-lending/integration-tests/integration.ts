import Web3 from "web3";
import { Account } from "web3-core";
import { ERC20Token } from "../src/clients/erc20Token";
import { OToken, OTokenParameter } from "../src/clients/oToken";
import { Comptroller } from "../src/clients/comptroller";
import { JumpInterestV2 } from "../src/clients/jumpInterestV2";
import { IntegrationClient } from "../src/clients/integration";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";

async function poolInfo( integrationClient: IntegrationClient, oToken: OToken, blockTime: number) {
  console.log('==== poolInfo begin ====');
  const poolInfo = await integrationClient.poolInfo(oToken, blockTime);
  console.log('poolInfo:', poolInfo);
  console.log('==== poolInfo end ====');
}

async function collateralSettings( integrationClient: IntegrationClient) {
  console.log('==== collateralSettings begin ====');
  const collateralSettings = await integrationClient.collateralSettings();
  console.log('collateralSettings:', collateralSettings);
  console.log('==== collateralSettings end ====');
}

async function interestRateModel( integrationClient: IntegrationClient, oToken: OToken, blockTime: number) {
  console.log('==== interestRateModel begin ====');
  const interestRateModel = await integrationClient.interestRateModel(blockTime);
  console.log('interestRateModel:', interestRateModel);
  console.log('==== interestRateModel end ====');
}

async function main() {
  const config = readJsonSync('./config/config.json');

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  if (config.encryptedAccountJson) {
    const pw = await readPassword();
    account = loadWalletFromEncyrptedJson(
      config.encryptedAccountJson,
      pw,
      web3
    );
  } else if (config.privateKey) {
    account = loadWalletFromPrivate(config.privateKey, web3);
  } else {
    throw Error("Cannot setup account");
  }

  console.log("Using account:", account.address);

  // load the oToken object
  const oTokenAbi = readJsonSync("./config/oToken.json");
  const oToken = new OToken(
    web3,
    oTokenAbi,
    config.oTokens.oKono.address,
    account,
    config.oTokens.oKono.parameters
  );

  // load the erc20 token object
  const erc20Abi = readJsonSync("./config/erc20.json");
  const erc20Token = new ERC20Token(
    web3,
    erc20Abi,
    oToken.parameters.underlying,
    account
  );

  const comptrollerAbi = readJsonSync("./config/comptroller.json");
  const comptroller = new Comptroller(
    web3,
    comptrollerAbi,
    oToken.parameters.comptroller,
    account
  );

  // load JumpInterestV2 object
  const jumpInterestV2Abi = readJsonSync("./config/jumpInterestV2.json");
  const jumpInterestV2 = new JumpInterestV2(
    web3,
    jumpInterestV2Abi,
    config.jumpInterestV2.address,
    account
  );

  const confirmations = { confirmations: 3 };
  const blockTime = 15;

  // actual tests
  const integrationClient = new IntegrationClient(
    account,
    comptroller,
    jumpInterestV2,
    confirmations
  );
  const poolInfoResponse = await integrationClient.poolInfo(oToken, blockTime);
  console.log(poolInfoResponse);

  const collateralSettingsResponse =
    await integrationClient.collateralSettings();
  console.log(collateralSettingsResponse);

  const interestRateModelResponse = await integrationClient.interestRateModel(
    blockTime
  );
  console.log(interestRateModelResponse);
}

describe('Integration client', () => {
  const config = readJsonSync('./config/config.json');
  const oTokenAbi = readJsonSync('./config/oToken.json');
  const erc20Abi = readJsonSync('./config/erc20.json');
  const comptrollerAbi = readJsonSync("./config/comptroller.json");
  const jumpInterestV2Abi = readJsonSync("./config/jumpInterestV2.json");
  const confirmations = { confirmations: 3 };
  const blockTime = 15;

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));

  let account: Account;
  let oToken: OToken;
  let erc20Token: ERC20Token;
  let comptroller: Comptroller;
  let jumpInterestV2: JumpInterestV2;
  let integrationClient: IntegrationClient

  beforeAll(async () => {
    if (config.encryptedAccountJson) {
      const pw = await readPassword();
      account = loadWalletFromEncyrptedJson(config.encryptedAccountJson, pw, web3);
    } else if (config.privateKey) {
      account = loadWalletFromPrivate(config.privateKey, web3);
    } else {
      throw Error('Cannot setup account');
    }

    console.log('Using account:', account);

    // load the oToken object
    oToken = new OToken(web3, oTokenAbi, config.oTokens.oKono.address, account, config.oTokens.oKono.parameters);

    // load the erc20 token object
    erc20Token = new ERC20Token(web3, erc20Abi, oToken.parameters.underlying, account);
  
    // load the comptroller object
    comptroller = new Comptroller(
      web3,
      comptrollerAbi,
      oToken.parameters.comptroller,
      account
    );
  
    // load JumpInterestV2 object
    jumpInterestV2 = new JumpInterestV2(
      web3,
      jumpInterestV2Abi,
      config.jumpInterestV2.address,
      account
    );

    // load integration client 
      integrationClient = new IntegrationClient(
      account,
      comptroller,
      jumpInterestV2,
      confirmations
    );
  });

  it('key flow test', async () => {
    await poolInfo(integrationClient, oToken, blockTime);
    await interestRateModel(integrationClient, oToken, blockTime);
    await collateralSettings(integrationClient);
  });
});
