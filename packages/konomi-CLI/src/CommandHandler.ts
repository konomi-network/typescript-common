import Web3 from 'web3';
import { Account } from 'web3-core';
import { ERC20Token } from '../../ocean-lending/src/erc20Token';
import { OToken } from '../../ocean-lending/src/oToken';
import { Comptroller } from '../../ocean-lending/src/comptroller';
import { OptionValues } from "commander"
import { ensure, loadWalletFromEncyrptedJson, loadWalletFromPrivate, ONE_ETHER, readJsonSync, readPassword } from '../../ocean-lending/src/utils';

/**
 * The OceanLeningHandler class for CLI's  OceanLending command .
 */
export class OceanLendingHandler {
    // OceanLending config path
    protected  configPath: string;
    // The OecanLending subCommand
    protected  subCommand: string;
    // The adreess of token
    protected tokenAddress: string;
    // The amount of tokens for operations
    protected amount: string;


    constructor(configPath:string, subCommand: string, tokenAddress: string, amount: string) {
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
    public async handle(): Promise<any> {
        console.log("OceanLendingHandler is handling!");
        const [account, oToken, token] = await this.parseConfig();
        switch (this.subCommand) {
            case 'borrow':
                this.borrow(account, oToken, token);
                break;

            case 'repay':
                this.repay(account, oToken, token);
                break;
                                
            default:
                console.log('unknown subcommand')
                break;
        }
    }

    private async borrow(account: Account, oToken: OToken, token: ERC20Token): Promise<any> {
        console.log("==== borrow ====");
        const erc20Before = await token.balanceOf(account.address);
        const oTokenBefore = await oToken.balanceOf(account.address);
    
        console.log("erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);
    
        const underlyingToBorrow = 50;
        const underlyingDecimals = 18;
        const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
        await oToken.borrow(scaledUpBorrowAmount, { confirmations: 3 });
    
        const balance = await oToken.borrowBalanceCurrent(account.address);
        console.log(`Borrow balance is ${balance / Math.pow(10, underlyingDecimals)}`);
    
        await oToken.approve(scaledUpBorrowAmount, { confirmations: 3 });
    
        const erc20After = await token.balanceOf(account.address);
        const oTokenAfter = await oToken.balanceOf(account.address);
    
        console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);
    
        ensure(
            erc20After > erc20Before,
            `invalid erc20 balance, expected ${erc20Before}, actual: ${erc20After}`
        );
    
        ensure(oTokenAfter == oTokenBefore, "invalid borrow balance");
        // oToken.convertFromUnderlying(amount);
        console.log("brrowed: " + this.amount);
    }


    

    private async repay(account: Account, oToken: OToken, token: ERC20Token): Promise<any> {
        console.log("repayed: " + this.amount);
        
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
        return [account, oToken, token] as const;
    }

}
