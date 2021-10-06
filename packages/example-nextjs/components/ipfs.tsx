import { useState, useEffect } from 'react'
import DecentralizedFileStorage from '@konomi/decentralized-fs';

const IpfsComponent = () => {
  const [id, setId] = useState(null);
  const [ipfs, setIpfs] = useState(null);
  const [version, setVersion] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (ipfs) return

      const dfs = new DecentralizedFileStorage();

      const dfsId = await dfs.id();
      const dfsVersion = await dfs.version();
      const dfsIsOnline = dfs.isOnline;

      setIpfs(dfs);
      setId(dfsId.id);
      setVersion(dfsVersion.version);
      setIsOnline(dfsIsOnline);
    }

    init()
  }, [ipfs]);

  if (!ipfs) {
    return '<h4>Connecting to IPFS...</h4>';
  }

  return (
    <div className="hello">
      <div className="greeting">
        Hello Id: {id}, Version: {version}, Status: {isOnline ? 'online': 'offline'}
      </div>
    </div>
  )
}

export default IpfsComponent;