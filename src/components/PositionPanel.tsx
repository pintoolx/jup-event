import { TrendingUp, TrendingDown, X, RefreshCw, Loader2 } from 'lucide-react'
import { DriftPosition } from '../types'

interface PositionPanelProps {
  position: DriftPosition
  isLoading: boolean
  isClosing: boolean
  onClose: () => void
  onRefresh: () => void
}

export function PositionPanel({
  position,
  isLoading,
  isClosing,
  onClose,
  onRefresh,
}: PositionPanelProps) {
  const isLong = position.direction === 'long'
  const pnlIsPositive = position.unrealizedPnl >= 0

  return (
    <div className="bg-[#E4EAF2] rounded-[24px] p-3 sm:p-4 lg:p-5 relative overflow-visible transition-all duration-500 flex flex-col z-10 w-full min-w-0 max-w-full outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          {isLong ? (
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <h3 className="text-base sm:text-lg font-black tracking-tight uppercase text-[#0E0F28]">
            {position.marketName} Position
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Position Info Grid */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] mb-3 sm:mb-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Direction */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Direction
            </span>
            <span
              className={`text-sm sm:text-base font-black uppercase ${
                isLong ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {position.direction.toUpperCase()}
            </span>
          </div>

          {/* Size */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Size
            </span>
            <span className="text-sm sm:text-base font-black text-[#0E0F28]">
              {position.size.toLocaleString(undefined, { maximumFractionDigits: 2 })} JUP
            </span>
          </div>

          {/* Entry Price */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Entry Price
            </span>
            <span className="text-sm sm:text-base font-black text-[#0E0F28]">
              ${position.entryPrice.toFixed(4)}
            </span>
          </div>

          {/* Liquidation Price */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Liq. Price
            </span>
            <span className="text-sm sm:text-base font-black text-orange-500">
              {position.liquidationPrice > 0
                ? `$${position.liquidationPrice.toFixed(4)}`
                : 'N/A'}
            </span>
          </div>

          {/* Mark Price */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Mark Price
            </span>
            <span className="text-sm sm:text-base font-black text-[#0E0F28]">
              {position.markPrice > 0 ? `$${position.markPrice.toFixed(4)}` : 'Loading...'}
            </span>
          </div>

          {/* Unrealized PnL */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0E0F28]/60 mb-1">
              Unrealized PnL
            </span>
            <span
              className={`text-sm sm:text-base font-black ${
                pnlIsPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {pnlIsPositive ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Close Position Button */}
      <button
        onClick={onClose}
        disabled={isClosing}
        className={`w-full py-3 sm:py-4 rounded-xl font-black text-xs sm:text-base tracking-wider sm:tracking-[0.2em] uppercase flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 ${
          isClosing
            ? 'bg-[#E4EAF2] text-[#0E0F28]/40 outline outline-2 outline-[#0E0F28]/40 shadow-[0px_2px_0px_#0E0F28]/40 cursor-not-allowed'
            : 'bg-red-500 text-white outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_#0E0F28] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_#0E0F28] active:translate-y-[1px] active:shadow-[0px_1px_0px_#0E0F28]'
        }`}
      >
        {isClosing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Closing Position...</span>
          </>
        ) : (
          <>
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close Position (Market)</span>
            <span className="sm:hidden">Close Position</span>
          </>
        )}
      </button>

      {/* Warning Text */}
      <p className="text-[10px] sm:text-xs text-[#0E0F28]/60 text-center mt-2 sm:mt-3">
        This will close your entire position at market price
      </p>
    </div>
  )
}
