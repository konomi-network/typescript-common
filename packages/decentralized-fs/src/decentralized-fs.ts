import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { CID, create as ipfsClient, IPFSHTTPClient, Options } from "ipfs-http-client";

class DecentralizedFileStorage {
    private ipfs: IPFSHTTPClient;

    constructor(url?: string) {
        const agentOptions = {
            keepAlive: true,
            keepAliveMsecs: 60 * 1000,
            maxSockets: 3
        };

        const agent = url?.startsWith('http') ? new httpAgent(agentOptions) : new httpsAgent(agentOptions);

        let options: Options = {
            agent: agent
        };

        if (url !== undefined) {
            options.url = url;
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
