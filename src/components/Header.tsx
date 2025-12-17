import { Wallet } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

interface HeaderProps {
  walletAddress: string | null
}

export function Header({ walletAddress }: HeaderProps) {
  const { login, logout, authenticated, ready } = usePrivy()

  const handleConnect = () => {
    if (!ready) return
    if (!authenticated) {
      login()
    }
  }

  return (
    <header className="relative z-20 py-6 px-8">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="PinTool" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-bold text-white">
            Pin<span className="jup-gradient">Tool</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          {authenticated ? (
            <div className="flex items-center gap-3">
              <div className="status-badge bg-jup-green/10 text-jup-green px-3 py-1.5 rounded-full border border-jup-green/20 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>{walletAddress || 'Loading...'}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!ready}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-jup-purple to-jup-blue hover:opacity-90 disabled:opacity-50 text-white font-medium transition-opacity flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

