import { Wallet } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

interface HeaderProps {
  walletAddress: string | null
}

// Format wallet address to show first 4 and last 4 characters
function formatWalletAddress(address: string | null): string {
  if (!address) return 'Loading...'
  if (address.length <= 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
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
    <header className="relative z-20 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-transparent flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <img src="/pintool.svg" alt="PinTool" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-black tracking-tighter uppercase leading-none text-[#0E0F28]">Catpurr</span>
          <span className="text-[9px] sm:text-[10px] text-[#0E0F28] font-bold tracking-[0.2em] uppercase">By PinTool</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {authenticated ? (
          <button
            onClick={logout}
            className="status-badge bg-[#2050F2]/10 text-[#0E0F28] px-2 sm:px-3 py-1.5 rounded-full border border-[#2050F2]/20 flex items-center gap-1 text-xs sm:text-sm hover:bg-[#2050F2]/20 transition-colors cursor-pointer"
          >
            <Wallet className="w-3 h-3" />
            <span className="hidden sm:inline">{formatWalletAddress(walletAddress)}</span>
            <span className="sm:hidden">{formatWalletAddress(walletAddress)}</span>
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={!ready}
              className="h-9 sm:h-10 px-3 sm:px-5 bg-white text-[#000814] rounded-lg text-[10px] sm:text-xs font-black tracking-widest uppercase hover:bg-gray-100 transition-all flex items-center gap-2 shadow-xl shadow-[#2050F2]/10 disabled:opacity-50"
            >
            <Wallet size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}
      </div>
    </header>
  )
}
