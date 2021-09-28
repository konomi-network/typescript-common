import { equal } from 'assert';
import DecentralizedFileStorage from '../src/decentralized-fs';

describe('decentralized-fs', () => {
    it('save and find tests', async () => {
        equal([1, 2, 3].indexOf(4), -1);

        const dfs = new DecentralizedFileStorage();
        const cid = await dfs.save("Hello, dfs!");
        equal(await dfs.find(cid), 'Hello, dfs!');
    })
})
