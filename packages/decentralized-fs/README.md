# `decentralized-fs`

> Decentralized File Storage Library

## Usage

```typescript
const decentralizedFs = require('decentralized-fs');

async function test() {
    const dfs = new DecentralizedFileStorage('http://localhost:5001');
    const cid = await dfs.save("hello, dfs!");
    console.log('cid: ', cid, ' content: ', await dfs.find(cid));
}

test()
```

