import { equal } from 'assert';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import DecentralizedFileStorage from '../src/decentralized-fs';

describe('decentralized-fs', () => {
    const dfs = new DecentralizedFileStorage('http://localhost:5001/');

    it('is online', async () => {
        equal(await dfs.isOnline(), true);
    })

    it('version test', async () => {
        equal((await dfs.version()).version, '0.9.1')
    })

    it('find test', async () => {
        const value = "hello, dfs!";
        const cid = 'Qmcb5MJyP3DDBXBFJ9wVqLu8V1AA7SSbSJ4kurHHjDDnw7';
        equal(await dfs.find(cid), value);
    })

    it('save test', async () => {
        const value = "hello, dfs!";
        const cid = await dfs.save(value);
        equal(cid, 'Qmcb5MJyP3DDBXBFJ9wVqLu8V1AA7SSbSJ4kurHHjDDnw7');
    })
})
