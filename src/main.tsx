import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import App from './App'
import './index.css'

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#8B5CF6',
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
)