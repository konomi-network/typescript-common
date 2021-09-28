import { CID, create as ipfsClient, IPFSHTTPClient } from 'ipfs-http-client'

class DecentralizedFileStorage {
    private ipfs: IPFSHTTPClient;

    constructor(url?: string) {
        if (url === undefined) {
            this.ipfs = ipfsClient();
        } else {
            this.ipfs = ipfsClient({url})
        }
    }

    public async save(content: any) {
        const result = await this.ipfs.add(JSON.stringify(content));
        return result.cid.toString();
    }

    public async find(cid: string) {
        let result = '';
        for await (const value of this.ipfs.cat(CID.parse(cid))) {
            result.concat(value.toString());
        }
        return result;
    }
}

export default DecentralizedFileStorage;