// Shim for rpc-websockets to fix compatibility with old @solana/web3.js in jito-ts
// The old version expects imports from 'rpc-websockets/dist/lib/client' which no longer exist in v9.x

import { Client } from 'rpc-websockets';

// Export Client as default (for: import RpcWebSocketCommonClient from 'rpc-websockets/dist/lib/client')
export default Client;

// Export Client as createRpc (for: import createRpc from 'rpc-websockets/dist/lib/client/websocket.browser')
export { Client as createRpc };
