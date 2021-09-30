import { Agent } from "http";
import { CID, create as ipfsClient, IPFSHTTPClient } from "ipfs-http-client";

class DecentralizedFileStorage {
    private ipfs: IPFSHTTPClient;

    constructor(url?: string) {
        const agent = new Agent({
            keepAlive: true,
        });

        let options = {
            agent: agent,
        };

        if (url !== undefined) {
            options = { ...options, ...{ url: new URL(url) } };
        }

        this.ipfs = ipfsClient(options);
    }

    public isOnline(): boolean {
        return this.ipfs.isOnline();
    }

    public async save(content: any): Promise<string> {
        const result = await this.ipfs.add(JSON.stringify(content));
        return result.cid.toString();
    }

    public async find(cid: string): Promise<string> {
        let result = "";
        for await (const value of this.ipfs.cat(CID.parse(cid))) {
            result += value.toString();
        }
        return result;
    }
}

export default DecentralizedFileStorage;
