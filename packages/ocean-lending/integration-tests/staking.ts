import { exit } from "process";
import Web3 from "web3";
import { Account } from "web3-core";
import { StakingV1 } from "../src/clients/staking";
import {
  loadWalletFromEncyrptedJson,
  loadWalletFromPrivate,
  readJsonSync,
  readPassword,
} from "../src/utils";

async function main() {
  const config = readJsonSync("./config/config.json");

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

  const abi = readJsonSync("./config/stakingV1.json");
  const client = new StakingV1(web3, abi, config.staking.address, account);

  // actual tests
  await client.supplyReward("30000000000000000000000", { confirmations: 3 });
  // console.log(await client.stakingToken());
}

main()
  .then(() => exit(0))
  .catch((e) => {
    console.log(e);
    exit(1);
  });
