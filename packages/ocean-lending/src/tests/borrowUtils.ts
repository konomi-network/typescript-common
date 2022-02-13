import { Account } from 'web3-core';
import { ERC20Token } from '../erc20Token';
import { OToken } from '../oToken';
import { Comptroller } from '../comptroller';
import { ensure } from '../utils';

export async function enterMarkets(account: Account, collateral: string, comptroller: Comptroller) {
    console.log("==== enterMarkets ====");
    const markets = [collateral];
    await comptroller.enterMarkets(markets, { confirmations: 3 });

    const liquidity = await comptroller.getAccountLiquidity(account.address);
    console.log(`You have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);

    const collateralFactor = await comptroller.markets(collateral);
    console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as oKONO.`);
}

export async function borrow(account: Account, oToken: OToken, token: ERC20Token) {
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
}

export async function repayBorrow(account: Account, oToken: OToken, token: ERC20Token) {
    console.log("==== repayBorrow ====");
    const erc20Before = await token.balanceOf(account.address);
    const oTokenBefore = await oToken.balanceOf(account.address);
    console.log("erc20Before:", erc20Before, " oTokenBefore:", oTokenBefore);

    const underlyingToBorrow = 50;
    const underlyingDecimals = 18;
    const scaledUpBorrowAmount = underlyingToBorrow * Math.pow(10, underlyingDecimals);
    const balance = await oToken.borrowBalanceCurrent(account.address);
    console.log(`Borrow balance is ${balance / Math.pow(10, underlyingDecimals)}`);

    await oToken.repayBorrow(scaledUpBorrowAmount, { confirmations: 3 });

    const erc20After = await token.balanceOf(account.address);
    const oTokenAfter = await oToken.balanceOf(account.address);
    console.log("erc20After:", erc20After, " oTokenAfter:", oTokenAfter);

    ensure(
        erc20Before > erc20After,
        `invalid erc20 balance, expected ${erc20After} to be bigger than actual: ${erc20After}`
    );
}
