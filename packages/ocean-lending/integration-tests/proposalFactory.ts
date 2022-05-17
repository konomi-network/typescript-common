import 'jest';
import { NewOcean } from '../src/proposal/detail/newOcean';
import { readJsonSync } from '../src/reading';
import Web3 from 'web3';
import { Address, Uint16 } from '../src/types';
import { InterestConfig, PoolConfig } from '../src/config';
import { ProposalFactory } from '../src/proposal/factory';
import { ProposalType } from '../src/proposal/type';

export function newOceanConfig(): PoolConfig {
    const tokenA = {
        underlying: Address.fromString('0x9d31a83fAEAc620450EBD9870fCecc6AfB1d99a3'),
        subscriptionId: new Uint16(1),
        interest: new InterestConfig(
            new Uint16(1001), // baseRatePerYear
            new Uint16(2002), // multiplierPerYear
            new Uint16(3003), // jumpMultiplierPerYear
            new Uint16(4004) // kink
        ),
        collateral: {
            canBeCollateral: false,
            collateralFactor: new Uint16(0)
        }
    };
    const tokenB = {
        underlying: Address.fromString('0x30cDBa5e339881c707E140A5E7fe27fE1835d0dA'),
        subscriptionId: new Uint16(1),
        interest: new InterestConfig(
            new Uint16(1001), // baseRatePerYear
            new Uint16(2002), // multiplierPerYear
            new Uint16(3003), // jumpMultiplierPerYear
            new Uint16(4005) // kink
        ),
        collateral: {
            canBeCollateral: true,
            collateralFactor: new Uint16(1001),
        }
    };
    return {
        closeFactor: new Uint16(5000),
        liquidationIncentive: new Uint16(1080),
        tokens: [tokenA, tokenB]
    };
}

describe('PropsalFactory', () => {
    let web3: Web3;
    let factory: ProposalFactory;

    beforeAll(async () => {
        const config = readJsonSync('./config/config.json');
        web3 = new Web3(new Web3.providers.HttpProvider(config.nodeUrl));
        factory = new ProposalFactory(web3);
    });

    it('makeProposal works', () => {
        const oceanConfig = newOceanConfig();
        const proposal = factory.makeProposal(
            ProposalType.NewOcean,
            {
                pool: oceanConfig,
                leasePeriod: 1000000,
                poolOwner: '0x65B0c8b91707B68C0B23388001B9dC7aab3f6A81'
            }
        );
        expect(proposal).toBeDefined();
    });

    it('fromHex works', () => {
        const oceanConfig = newOceanConfig();
        const ocean = new NewOcean({
            pool: oceanConfig,
            leasePeriod: 1000000,
            poolOwner: '0x65B0c8b91707B68C0B23388001B9dC7aab3f6A81'
        });
        const calldata = ocean.calldata(web3);
        const { type, details } = factory.fromHex(calldata, web3);
        expect(details).toEqual(ocean);
        expect(type).toEqual(ProposalType.NewOcean);
    });
});