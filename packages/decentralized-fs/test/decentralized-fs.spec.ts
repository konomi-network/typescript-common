import { equal } from 'assert';
import DecentralizedFileStorage from '../src/decentralized-fs';

describe('decentralized-fs', () => {
    const dfs = new DecentralizedFileStorage();

    it('is online', async () => {
        equal(await dfs.isOnline(), true);
    })

    it('save and find tests', async () => {
        const cid = await dfs.save("Hello, dfs!");
        equal(await dfs.find(cid), 'Hello, dfs!');
    })
})
