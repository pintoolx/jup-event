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
    <header className="relative z-20 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-transparent flex-shrink-0 min-w-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
        <img src="/pintool.svg" alt="PinTool" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-black tracking-tighter uppercase leading-none text-[#0E0F28]">Catpurr</span>
          <span className="text-[9px] sm:text-[10px] text-[#0E0F28] font-bold tracking-[0.2em] uppercase">By PinTool</span>
        </div>
        </div>

      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
          {authenticated ? (
              <button
                onClick={logout}
            className="px-2 sm:px-3 py-1.5 rounded-lg bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
              >
            <Wallet className="w-3 h-3" />
            <span className="hidden sm:inline">{formatWalletAddress(walletAddress)}</span>
            <span className="sm:hidden">{formatWalletAddress(walletAddress)}</span>
              </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!ready}
              className="h-9 sm:h-10 px-3 sm:px-5 bg-[#E4EAF2] text-[#0E0F28] rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0px_2px_0px_black]"
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
