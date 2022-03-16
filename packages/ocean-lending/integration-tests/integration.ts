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

async function main() {
  // const config = readJsonSync('./config/config.json');
  const config = readJsonSync(
    "C:/Users/kun-d/Desktop/WFH/code/dev/client/packages/test-config/config.json"
  );

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

main();
