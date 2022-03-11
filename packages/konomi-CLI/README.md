# Installation

1. Install required dependencies

```
cd packages/konomi-cli & npm install
```

1. Compile

```
tsc
```

3. Link

```
npm link
```

# Quick Start

## OceanLending

### Help

```
konomi-cli --help

konomi-cli ocean --help

konomi-cli ocean enterMarkets --help

```

### EnterMarkets

```
konomi-cli ocean --config-path your-path-to-configuration-json enterMarkets
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json enterMarkets
```

### Deposit

```
konomi-cli ocean --config-path your-path-to-configuration-json deposit --amount 1000
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json deposit -a 1000
```

### Redeem

```
konomi-cli ocean --config-path your-path-to-configuration-json redeem --amount 1000
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json redeem -a 1000
```

### RedeemAll

```
konomi-cli ocean --config-path your-path-to-configuration-json redeemAll
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json redeemAll
```

### Borrow

```
konomi-cli  ocean --config-path your-path-to-configuration-json borrow --amount 10
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json borrow -a 10
```

### Repay

```
konomi-cli ocean --config-path your-path-to-configuration-json repay --amount 10
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json repay -a 10
```

### RepayAll

```
konomi-cli ocean --config-path your-path-to-configuration-json repayAll
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json repayAll
```

### Incentive

```
konomi-cli ocean --config-path your-path-to-configuration-json incentive
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json incentive
```

### CollateralFactor

```
konomi-cli ocean --config-path your-path-to-configuration-json collateralFactor
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json collateralFactor
```

### CloseFactor

```
konomi-cli ocean --config-path your-path-to-configuration-json closeFactor
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json closeFactor
```

### Multiplier

```
konomi-cli ocean --config-path your-path-to-configuration-json multiplier
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json multiplier
```

### BaseRate

```
konomi-cli ocean --config-path your-path-to-configuration-json baseRate
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json baseRate
```

### JumpMultiplier

```
konomi-cli ocean --config-path your-path-to-configuration-json jumpMultiplier
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json jumpMultiplier
```

### Kink

```
konomi-cli ocean --config-path your-path-to-configuration-json kink
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json kink
```

### BorrowRate

```
konomi-cli ocean --config-path your-path-to-configuration-json borrowRate
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json borrowRate
```

### SupplyRate

```
konomi-cli ocean --config-path your-path-to-configuration-json supplyRate
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json supplyRate
```

### BorrowRateAPY

```
konomi-cli ocean --config-path your-path-to-configuration-json borrowRateAPY --blockTime 60
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json borrowRateAPY -t 60
```

### SupplyRateAPY

```
konomi-cli ocean --config-path your-path-to-configuration-json supplyRateAPY --blockTime 60
```

_Abbreviation_

```
konomi-cli ocean -c your-path-to-configuration-json supplyRateAPY -t 60
```


## Staking

### Help

```
konomi-cli --help

konomi-cli staking --help

konomi-cli staking stakes --help

```

### Stakes

```
konomi-cli staking --config-path your-path-to-configuration-json stakes
```

_Abbreviation_

```
konomi-cli staking -c your-path-to-configuration-json stakes
```

### Deposit

```
konomi-cli staking --config-path your-path-to-configuration-json deposit --amount 1000
```

_Abbreviation_

```
konomi-cli staking -c your-path-to-configuration-json deposit -a 1000
```

### Withdraw

```
konomi-cli staking --config-path your-path-to-configuration-json withdraw --amount 100
```

_Abbreviation_

```
konomi-cli staking -c your-path-to-configuration-json withdraw -a 100
```

### WithdrawAll

```
konomi-cli staking --config-path your-path-to-configuration-json withdrawAll
```

_Abbreviation_

```
konomi-cli staking -c your-path-to-configuration-json withdrawAll
```

## Proposal

### Help

```
konomi-cli --help

konomi-cli proposal --help

konomi-cli proposal state --help

```

### State
```
konomi-cli proposal --config-path your-path-to-configuration-json state --proposalId 105978105293359864936781320627108150409165472001661103635647233237039377539468
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json state -i 105978105293359864936781320627108150409165472001661103635647233237039377539468
```

### Details
```
konomi-cli proposal --config-path your-path-to-configuration-json details --proposalId 105978105293359864936781320627108150409165472001661103635647233237039377539468
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json details -i 105978105293359864936781320627108150409165472001661103635647233237039377539468
```

### Hash
```
konomi-cli proposal --config-path your-path-to-configuration-json hash --symbol symbol --slug slug --sources "1,2,3" --clientType 1 --leasePeriod 2589570 --externalStorageHash QmZKvL23nkVPZqBYaWUFZupfHGezUCHr18ZM9PJCuiP5o7
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json hash -s symbol -u slug -r "1,2"  -t 1 -l 2589570 -x QmZKvL23nkVPZqBYaWUFZupfHGezUCHr18ZM9PJCuiP5o7
```

### Propose
```
konomi-cli proposal --config-path your-path-to-configuration-json propose --symbol symbol --slug slug --sources "1,2,3" --clientType 1 --leasePeriod 2589570 --externalStorageHash QmZKvL23nkVPZqBYaWUFZupfHGezUCHr34ZM9PJCuiP539
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json propose -s symbol -u slug -r "1,2"  -t 1 -l 2589570 -x QmZKvL23nkVPZqBYaWUFZupfHGezUCHr34ZM9PJCuiP5o7
```

### Execute
```
konomi-cli proposal --config-path your-path-to-configuration-json execute --proposalId 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json execute -i 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

### Cancel
```
konomi-cli proposal --config-path your-path-to-configuration-json cancel --proposalId 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json cancel -i 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

### HasVoted
```
konomi-cli proposal --config-path your-path-to-configuration-json hasVoted --proposalId 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json hasVoted -i 86786394426417530495648921554089556514124533705308787549003922815704448344156
```

### CastVote
```
konomi-cli proposal --config-path your-path-to-configuration-json castVote --proposalId 93043985785138287445088189606995015361768622353000160345923463139093763679557  --type 1
```

_Abbreviation_

```
konomi-cli proposal --config-path your-path-to-configuration-json castVote -i 93043985785138287445088189606995015361768622353000160345923463139093763679557  -t 1
```

### CastVoteWithReason
```
konomi-cli proposal --config-path your-path-to-configuration-json castVoteWithReason --proposalId 93043985785138287445088189606995015361768622353000160345923463139093763679557 --type 1 --reason "this is the vote reason"
```

_Abbreviation_

```
konomi-cli proposal -c your-path-to-configuration-json castVoteWithReason -i 86786394426417530495648921554089556514124533705308787549003922815704448344156 -t 1 -r "this is the vote reason"
```

## Subscription

### Help

```
konomi-cli --help

konomi-cli subscription --help

konomi-cli subscription minLeasePeriod --help

```

### MinLeasePeriod

```
konomi-cli subscription --config-path your-path-to-configuration-json minLeasePeriod
```

_Abbreviation_

```
konomi-cli subscription -c your-path-to-configuration-json minLeasePeriod
```

### UpdateSubscriptionStatus

```
konomi-cli subscription --config-path your-path-to-configuration-json update --subscriptionId 100  --suspended true
```

_Abbreviation_

```
konomi-cli subscription -c your-path-to-configuration-json update --i 100  --u true
```

### NewSubscription

```
konomi-cli subscription --config-path your-path-to-configuration-json new --externalStorageHash 100  --sourceCount 2 --leasePeriod 2689570 --clientType 1 --onBehalfOf 0xefFf44eBb7DA826ADFCB01C1B1f1c039Fb0938aa
```

_Abbreviation_

```
konomi-cli subscription -c your-path-to-configuration-json new -x 100  -r 2 -l 2689570 -t 1 -n 0xefFf44eBb7DA826ADFCB01C1B1f1c039Fb0938aa
```

### SubscribeByExisting

```
konomi-cli subscription --config-path your-path-to-configuration-json subscribe --subscriptionId 100  --leasePeriod 3689570
```

_Abbreviation_

```
konomi-cli subscription -c your-path-to-configuration-json subscribe -i 100  -l 3689570
```


### ExtendSubscription

```
konomi-cli subscription --config-path your-path-to-configuration-json extend --subscriptionId 100  --extendPeriod 3689570
```

_Abbreviation_

```
konomi-cli subscription -c your-path-to-configuration-json extend -i 100  -l 3689570
```



