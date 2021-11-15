import DecentralizedFileStorage from './decentralized-fs';
// import { TextEncoder, TextDecoder } from 'util';

// global.TextEncoder = TextEncoder;
// global.TextDecoder = TextDecoder;

describe('decentralized-fs', () => {
	const dfs = new DecentralizedFileStorage('http://localhost:5002/');

	it('is online', async () => {
		expect(await dfs.isOnline).toEqual(true);
	});

	it('version test', async () => {
		expect((await dfs.version()).version).toEqual('0.11.1');
	});

	it('find test', async () => {
		const cid = 'Qmcb5MJyP3DDBXBFJ9wVqLu8V1AA7SSbSJ4kurHHjDDnw7';
		expect(await dfs.find(cid)).toEqual('hello, dfs!');
	});

	it('save test', async () => {
		const value = 'hello, dfs!';
		const cid = await dfs.save(value);
		expect(cid).toEqual('Qmcb5MJyP3DDBXBFJ9wVqLu8V1AA7SSbSJ4kurHHjDDnw7');
	});
});
