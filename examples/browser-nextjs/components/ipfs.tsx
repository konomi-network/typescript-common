import { useState, useEffect } from 'react'
import DecentralizedFileStorage from '@konomi/decentralized-fs/dist/decentralized-fs';

const IpfsComponent = () => {
  const [id, setId] = useState(null);
  const [ipfs, setIpfs] = useState(null);
  const [version, setVersion] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [cid, setCID] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (ipfs) return

      const dfs = new DecentralizedFileStorage('http://localhost:5002');

      const dfsId = await dfs.id();
      const dfsVersion = await dfs.version();
      const dfsIsOnline = dfs.isOnline;

      setIpfs(dfs);
      setId(dfsId.id);
      setVersion(dfsVersion.version);
      setIsOnline(dfsIsOnline);

      const cid = await dfs.save(JSON.stringify({test: 'hello, dfs!'}));
      setCID(cid);

      const content = await dfs.find(cid);
      setContent(Uint8ArrayToString(content.split(',')));
    }

    init()
  }, [ipfs]);

  const Uint8ArrayToString = (u8aStr: number[]) => {
    var dataString = '';
    for (const v of u8aStr) {
      dataString += String.fromCharCode(v);
    }
    return dataString;
  }

  if (!ipfs) {
    return '<h4>Connecting to IPFS...</h4>';
  }

  return (
    <div className="hello">
      <div className="greeting">
        <h4 data-test="id">Id: {id}</h4>
        <h4 data-test="version">Version: {version}</h4>
        <h4 data-test="status">Status: {isOnline ? 'Online': 'Offline'}</h4>
        <h4 data-test="cid">CID: {cid}</h4>
        <h4 data-test="content">content: {content}</h4>
      </div>
    </div>
  )
}

export default IpfsComponent;