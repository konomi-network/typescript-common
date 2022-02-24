import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/erc20Token';
import { OToken } from '../../ocean-lending/src/oToken';
import { Comptroller } from '../../ocean-lending/src/comptroller';
import { OptionValues } from "commander"
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../../ocean-lending/src/utils';
import { enterMarkets ,borrow, repayBorrow} from '../../ocean-lending/integration-tests/borrow'
import { depositWorks, redeemNoBorrow} from '../../ocean-lending/integration-tests/deposit'
import{ PriceOracle} from '../../ocean-lending/src/priceOracle'
/**
 * The OceanLeningHandler class for CLI's  OceanLending command .
 */
export class OceanLendingHandler {
    // The OceanLending config path
    protected  configPath: string;
    // The OecanLending subCommand
    protected  subCommand: string;
    // The adreess of token
    protected tokenAddress: string;
    // The amount of tokens for operations
    protected amount: number;


    constructor(configPath:string, subCommand: string, tokenAddress: string, amount=0) {
        this.configPath = configPath;
        this.subCommand = subCommand;
        this.tokenAddress = tokenAddress;
        this.amount = amount;
    }


    /**
     * handle OceanLending command.
     * @param method The method object
     * @returns Command execution result.
     */
    public async handle() {
        const [account, oToken, token, comptroller, config, priceOracle] = await this.parseConfig();
        switch (this.subCommand) {
            case 'enterMarkets':
                const markets = [config.oTokens.oKono.address];
                enterMarkets(account, markets, comptroller);
                break;

            case 'depositWorks':
                await depositWorks(account, oToken, token, this.amount);
                break;
                
            case 'redeemNoBorrow':
                await redeemNoBorrow(account, oToken, token);
                break;

            case 'borrow':
                await borrow(account, oToken, token, priceOracle, comptroller, this.amount);
                break;

            case 'repay':
                await repayBorrow(account, oToken, token, priceOracle);
                break;
                                
            default:
                console.log('unknown subCommand')
                break;
        }
    }

    private async enterMarkets(account: Account, markets: string[], comptroller: Comptroller): Promise<any> {
        enterMarkets(account, markets, comptroller);
    }

    private async depositWorks(account: Account, oToken: OToken, token: ERC20Token){
        // depositWorks(account, oToken, token);
    }

    private async  redeemNoBorrow(account: Account, oToken: OToken, token: ERC20Token) {
        // redeemNoBorrow(account, oToken, token);

    }

    private async borrow(account: Account, oToken: OToken, token: ERC20Token, comptroller: Comptroller, priceOracle: PriceOracle): Promise<any> {
        // borrow(account, oToken, token, comptroller, priceOracle);
    }
    
    private async  repayBorrow(account: Account, oToken: OToken, token: ERC20Token, priceOracle: PriceOracle): Promise<any> {
        console.log("repayed: " + this.amount);
        // repayBorrow(account, oToken, token, priceOracle);
    
    }

    

    private async parseConfig(){
        const config = readJsonSync(this.configPath);

        const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));
    
        let account : Account;
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

}
