import DecentralizedFileStorage from './decentralized-fs';

// start ipfs daemon before running test
// example at localhost:5001

describe('decentralized-fs', () => {
  let cidResult = '';
  const dfs = new DecentralizedFileStorage('http://localhost:5001');

  it('is online', async () => {
    expect(await dfs.isOnline).toEqual(true);
  });

  it('version test', async () => {
    expect((await dfs.version()).version).not.toBeNull();
  });

  it('save test with simple string', async () => {
    const value = 'hello, dfs!';
    const cid = await dfs.save(value);
    cidResult = cid;
    expect(cid).toEqual(cidResult);
  });

  it('find test simple string', async () => {
    expect(await dfs.find(cidResult)).toEqual('hello, dfs!');
  });

  it('save test with json string', async () => {
    const value = '[{a: 1}]';
    const cid = await dfs.save(value);
    cidResult = cid;
    expect(cid).toEqual(cidResult);
  });

  it('find test json string', async () => {
    const result = await dfs.find(cidResult);
    expect(result).toEqual('[{a: 1}]');
  });
});
