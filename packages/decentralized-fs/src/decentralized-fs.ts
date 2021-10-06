import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { CID, create as ipfsClient, IPFSHTTPClient, Options } from "ipfs-http-client";

class DecentralizedFileStorage {
    private ipfs: IPFSHTTPClient;

    constructor(url?: string) {
        const agentOptions = {
            keepAlive: true,
            keepAliveMsecs: 60 * 1000,
            // Similar to browsers which limit connections to six per host
            maxSockets: 6,
        };

        const agent = url?.startsWith('https') ? new httpsAgent(agentOptions) : new httpAgent(agentOptions);

        let options: Options = {
            agent: agent
        };

        if (url !== undefined) {
            options.url = url;
        }

        this.ipfs = ipfsClient(options);
    }

    get isOnline(): boolean {
        return this.ipfs.isOnline();
    }

    public async id() {
        return await this.ipfs.id();
    }

    public async version() {
        return await this.ipfs.version();
    }

    public async save(content: any): Promise<string> {
        const result = await this.ipfs.add(JSON.stringify(content));
        return result.cid.toString();
    }

    public async find(cid: string): Promise<string> {
        let data = '';
        const stream = this.ipfs.cat(CID.parse(cid));
        for await (const chunk of stream) {
            data += JSON.parse(chunk.toString());
        }
        return data;
    }
}

export default DecentralizedFileStorage;
