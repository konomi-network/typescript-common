# `decentralized-fs`

> Decentralized File Storage Library

## Usage

Before using package at local, make sure you've install `ipfs` and run `ipfs daemon`

```shell
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST", "OPTIONS"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
    ipfs daemon
```

Then try with below example:

```typescript
import DecentralizedFileStorage from '@konomi-network/decentralized-fs';

async function test() {
	const dfs = new DecentralizedFileStorage('http://localhost:5001');
	const cid = await dfs.save('hello, dfs!');
	console.log('cid: ', cid, ' content: ', await dfs.find(cid));
}

test();
```
