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