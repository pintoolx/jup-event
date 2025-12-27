import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { DegenConfig } from '../types'
import {
  WalletBalances,
  validateDegenConfig,
  calculateLiquidationPrice,
  getMaxCollateral,
} from '../hooks/useWalletBalance'

interface DegenConfigPanelProps {
  isVisible: boolean
  config: DegenConfig
  onConfigChange: (config: DegenConfig) => void
  walletBalances: WalletBalances | null
  jupPrice: number
  solPrice: number
  positionSize: number // Fixed JUP position size (e.g., 250)
}

const LEVERAGE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const PERCENTAGE_OPTIONS = [25, 50, 75, 100] // 100 = MAX

export function DegenConfigPanel({
  isVisible,
  config,
  onConfigChange,
  walletBalances,
  jupPrice,
  solPrice,
  positionSize,
}: DegenConfigPanelProps) {
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [inputValue, setInputValue] = useState(config.collateralAmount.toString())

  // Update input value when config changes externally
  useEffect(() => {
    if (config.collateralAmount > 0) {
      setInputValue(config.collateralAmount.toString())
    }
  }, [config.collateralAmount])

  // Validate current config
  const validation = walletBalances
    ? validateDegenConfig(config, walletBalances)
    : { isValid: false, error: 'Loading balances...', requiredCollateral: 0, availableBalance: 0 }

  // Calculate liquidation price
  const liquidation = jupPrice > 0
    ? calculateLiquidationPrice(jupPrice, config.leverage, config.direction)
    : null

  // Calculate position exposure
  const positionExposure = positionSize * config.leverage

  // Calculate required collateral info for display (uses solPrice for SOL collateral)
  const getCollateralInfo = () => {
    if (jupPrice <= 0) return null
    const notionalValue = positionSize * jupPrice
    const marginRequired = notionalValue / config.leverage

    if (config.collateralToken === 'SOL' && solPrice > 0) {
      const SOL_BUFFER = 1.30
      const required = (marginRequired / solPrice) * SOL_BUFFER
      return { required: Math.ceil(required * 100) / 100, unit: 'SOL' }
    }
    return { required: Math.ceil(marginRequired), unit: 'USDC' }
  }

  const collateralInfo = getCollateralInfo()

  // Handle leverage change
  const handleLeverageChange = useCallback((leverage: number) => {
    onConfigChange({ ...config, leverage })
  }, [config, onConfigChange])

  // Handle direction change
  const handleDirectionChange = useCallback((direction: 'long' | 'short') => {
    onConfigChange({ ...config, direction })
  }, [config, onConfigChange])

  // Handle collateral token change
  const handleTokenChange = useCallback((token: 'SOL' | 'USDC') => {
    onConfigChange({ ...config, collateralToken: token, collateralAmount: 0 })
    setInputValue('')
    setShowTokenDropdown(false)
  }, [config, onConfigChange])

  // Handle collateral amount change
  const handleAmountChange = useCallback((value: string) => {
    setInputValue(value)
    const numValue = parseFloat(value) || 0
    onConfigChange({ ...config, collateralAmount: numValue })
  }, [config, onConfigChange])

  // Handle percentage button click
  const handlePercentageClick = useCallback((percentage: number) => {
    if (!walletBalances) return
    const maxAmount = getMaxCollateral(walletBalances, config.collateralToken)
    const amount = (maxAmount * percentage) / 100
    // Round based on token type
    const roundedAmount = config.collateralToken === 'SOL'
      ? Math.floor(amount * 10000) / 10000 // 4 decimal places for SOL
      : Math.floor(amount * 100) / 100 // 2 decimal places for USDC
    setInputValue(roundedAmount.toString())
    onConfigChange({ ...config, collateralAmount: roundedAmount })
  }, [walletBalances, config, onConfigChange])

  // Get available balance display
  const getBalanceDisplay = () => {
    if (!walletBalances) return 'Loading...'
    const balance = config.collateralToken === 'SOL'
      ? walletBalances.sol
      : walletBalances.usdc
    const decimals = config.collateralToken === 'SOL' ? 4 : 2
    return `${balance.toFixed(decimals)} ${config.collateralToken}`
  }

  if (!isVisible) return null

  return (
    <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="bg-[#E4EAF2] rounded-xl p-4 border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
        {/* Header */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E0F28] mb-4">
          Degen Configuration
        </h4>

        {/* Leverage Selection */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#0E0F28]/70 mb-2 block">
            Leverage
          </label>
          <div className="flex flex-wrap gap-1">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                onClick={() => handleLeverageChange(lev)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 border-2 border-[#0E0F28] ${
                  config.leverage === lev
                    ? 'bg-[#2050F2] text-white shadow-[0px_2px_0px_black]'
                    : 'bg-white text-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
          {config.leverage > 5 && (
            <div className="mt-2 flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} />
              <span className="text-[10px] font-medium">High leverage increases liquidation risk</span>
            </div>
          )}
        </div>

        {/* Direction Selection */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#0E0F28]/70 mb-2 block">
            Direction
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionChange('long')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border-2 border-[#0E0F28] flex items-center justify-center gap-2 ${
                config.direction === 'long'
                  ? 'bg-emerald-500 text-white shadow-[0px_2px_0px_black]'
                  : 'bg-white text-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]'
              }`}
            >
              <TrendingUp size={14} />
              Long
            </button>
            <button
              onClick={() => handleDirectionChange('short')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border-2 border-[#0E0F28] flex items-center justify-center gap-2 ${
                config.direction === 'short'
                  ? 'bg-red-500 text-white shadow-[0px_2px_0px_black]'
                  : 'bg-white text-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]'
              }`}
            >
              <TrendingDown size={14} />
              Short
            </button>
          </div>
        </div>

        {/* Collateral Input */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#0E0F28]/70 mb-2 block">
            Collateral
          </label>

          {/* Percentage Buttons */}
          <div className="flex gap-1 mb-2">
            {PERCENTAGE_OPTIONS.map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentageClick(pct)}
                disabled={!walletBalances || walletBalances.isLoading}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white text-[#0E0F28] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>

          {/* Token Selector + Amount Input */}
          <div className="flex gap-2">
            {/* Token Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-white text-[#0E0F28] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] font-bold text-sm min-w-[90px] justify-between"
              >
                {config.collateralToken}
                <ChevronDown size={14} className={`transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTokenDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border-2 border-[#0E0F28] rounded-lg shadow-lg z-20">
                  {['SOL', 'USDC'].map((token) => (
                    <button
                      key={token}
                      onClick={() => handleTokenChange(token as 'SOL' | 'USDC')}
                      className={`w-full px-3 py-2 text-left font-bold text-sm hover:bg-[#E4EAF2] first:rounded-t-lg last:rounded-b-lg ${
                        config.collateralToken === token ? 'bg-[#2050F2]/10 text-[#2050F2]' : 'text-[#0E0F28]'
                      }`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount Input */}
            <input
              type="number"
              value={inputValue}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className={`flex-1 px-3 py-2.5 rounded-lg bg-white text-[#0E0F28] border-2 shadow-[0px_2px_0px_black] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2050F2] ${
                !validation.isValid && config.collateralAmount > 0
                  ? 'border-red-500'
                  : 'border-[#0E0F28]'
              }`}
            />
          </div>

          {/* Balance Display */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-[#0E0F28]/70">
              Balance: {getBalanceDisplay()}
            </span>
            {walletBalances?.isLoading && (
              <span className="text-[10px] text-[#0E0F28]/50">Updating...</span>
            )}
          </div>

          {/* Validation Error */}
          {!validation.isValid && validation.error && config.collateralAmount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-red-500">
              <AlertTriangle size={12} />
              <span className="text-[10px] font-medium">{validation.error}</span>
            </div>
          )}
        </div>

        {/* Position Preview */}
        <div className="p-3 rounded-lg bg-white border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#0E0F28]/70 mb-2">
            Position Preview
          </h5>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#0E0F28]/70">Position Size:</span>
              <span className="font-bold text-[#0E0F28]">
                {positionSize} JUP x {config.leverage}x = {positionExposure} JUP
              </span>
            </div>
            {collateralInfo && (
              <div className="flex justify-between text-xs">
                <span className="text-[#0E0F28]/70">Min. Collateral:</span>
                <span className="font-bold text-[#0E0F28]">
                  ~{collateralInfo.required} {collateralInfo.unit}
                </span>
              </div>
            )}
            {liquidation && jupPrice > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#0E0F28]/70">Est. Liquidation:</span>
                <span className={`font-bold ${config.direction === 'long' ? 'text-red-500' : 'text-emerald-500'}`}>
                  ${liquidation.liquidationPrice.toFixed(4)} ({liquidation.percentageChange > 0 ? '+' : ''}{liquidation.percentageChange.toFixed(1)}%)
                </span>
              </div>
            )}
            {jupPrice > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#0E0F28]/70">Current JUP Price:</span>
                <span className="font-bold text-[#0E0F28]">${jupPrice.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
