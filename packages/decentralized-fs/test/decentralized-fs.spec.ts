import { equal } from 'assert';
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import DecentralizedFileStorage from '../src/decentralized-fs';

describe('decentralized-fs', () => {
    const dfs = new DecentralizedFileStorage('http://localhost:5001');

    it('is online', async () => {
        equal(await dfs.isOnline(), true);
    })

    it('version test', async () => {
        equal((await dfs.version()).version, '0.9.1')
    })

    it('save and find tests', async () => {
        const value = {k: "Hello, dfs!"};
        const cid = await dfs.save(value);
        equal(await dfs.find(cid), value);
    })
})
