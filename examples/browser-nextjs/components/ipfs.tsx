import { useState, useEffect } from 'react'
import DecentralizedFileStorage from '@konomi/decentralized-fs/dist/decentralized-fs';

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
        <h4 data-test="id">Id: {id}</h4>
        <h4 data-test="version">Version: {version}</h4>
        <h4 data-test="status">Status: {isOnline ? 'Online': 'Offline'}</h4>
      </div>
    </div>
  )
}

export default IpfsComponent;