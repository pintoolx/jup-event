import { useState } from 'react'
import { Zap, Copy, AlertTriangle, ShieldCheck, Flame, Settings, TrendingUp, TrendingDown } from 'lucide-react'
import { ExecutionMode, DegenConfig } from '../types'
import { DisclaimerModal } from './DisclaimerModal'
import { DegenConfigModal } from './DegenConfigModal'
import { WalletBalances, validateDegenConfig, calculatePositionSizeJup } from '../hooks/useWalletBalance'

// Debug mode: use 10 JUP for testing, 250 JUP for production
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
const MIN_JUP_AMOUNT = isDebugMode ? 10 : 250

interface StepsPanelProps {
  isLoading: boolean
  isSuccess: boolean
  isCompleted: boolean
  buttonText: string
  onExecute: () => void
  onCopyTransferTx?: () => void
  selectedMode: ExecutionMode
  onModeChange: (mode: ExecutionMode) => void
  // Degen mode props
  degenConfig?: DegenConfig
  onDegenConfigChange?: (config: DegenConfig) => void
  walletBalances?: WalletBalances | null
  jupPrice?: number
  solPrice?: number
}

const hedgeSteps = [
  {
    number: 1,
    title: 'Buy JUP',
    description: 'Swap assets to JUP via Jupiter Aggregator for best rates.',
    tag: 'Jupiter Swap',
  },
  {
    number: 2,
    title: '1x Short JUP',
    description: 'Open 1x short position to neutralize price risk.',
    tag: 'Drift Protocol',
  },
  {
    number: 3,
    title: 'Send to Event',
    description: 'Transfer hedged JUP directly to the official event vault.',
    tag: 'Transfer',
  },
  {
    number: 4,
    title: 'Telegram Notification',
    description: 'Receive confirmation and updates via Telegram.',
    tag: 'Notification',
  },
]

const standardSteps = [
  {
    number: 1,
    title: 'Buy JUP',
    description: 'Swap assets to JUP via Jupiter Aggregator for best rates.',
    tag: 'Jupiter Swap',
  },
  {
    number: 2,
    title: 'Send to Event',
    description: 'Transfer JUP directly to the official event vault.',
    tag: 'Transfer',
  },
  {
    number: 3,
    title: 'Telegram Notification',
    description: 'Receive confirmation and updates via Telegram.',
    tag: 'Notification',
  },
]

// Dynamic degen steps based on configuration
const getDegenSteps = (config?: DegenConfig, positionSize?: number) => {
  const leverage = config?.leverage || 1
  const direction = config?.direction || 'long'
  const directionLabel = direction === 'long' ? 'Long' : 'Short'
  const collateral = config?.collateralAmount || 0
  const token = config?.collateralToken || 'SOL'
  const positionDisplay = positionSize && positionSize > 0 ? `${positionSize.toLocaleString()} JUP` : ''

  return [
    {
      number: 1,
      title: 'Buy JUP',
      description: 'Swap assets to JUP via Jupiter Aggregator for best rates.',
      tag: 'Jupiter Swap',
    },
    {
      number: 2,
      title: `${leverage}x ${directionLabel} JUP`,
      description: collateral > 0 && positionDisplay
        ? `Open ${positionDisplay} position with ${collateral} ${token} collateral.`
        : `Open ${leverage}x ${direction} position on JUP-PERP.`,
      tag: 'Drift Protocol',
    },
    {
      number: 3,
      title: 'Send to Event',
      description: 'Transfer JUP directly to the official event vault.',
      tag: 'Transfer',
    },
    {
      number: 4,
      title: 'Telegram Notification',
      description: 'Receive confirmation and updates via Telegram.',
      tag: 'Notification',
    },
  ]
}

export function StepsPanel({
  isLoading,
  isSuccess: _isSuccess,
  isCompleted,
  buttonText: _buttonText,
  onExecute,
  onCopyTransferTx,
  selectedMode,
  onModeChange,
  degenConfig,
  onDegenConfigChange,
  walletBalances,
  jupPrice = 0,
  solPrice = 0,
}: StepsPanelProps) {
  // Note: isSuccess and buttonText are kept for API compatibility but not currently used
  void _isSuccess
  void _buttonText
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showDegenModal, setShowDegenModal] = useState(false)

  // Calculate position size dynamically based on collateral
  const positionSizeJup = degenConfig
    ? calculatePositionSizeJup(
      degenConfig.collateralAmount,
      degenConfig.collateralToken,
      degenConfig.leverage,
      jupPrice,
      solPrice
    )
    : 0

  // Calculate swap cost for JUP based on collateral token (uses debug-aware MIN_JUP_AMOUNT)
  const swapCost = degenConfig && jupPrice > 0
    ? degenConfig.collateralToken === 'SOL'
      ? solPrice > 0 ? (MIN_JUP_AMOUNT * jupPrice) / solPrice : 0
      : MIN_JUP_AMOUNT * jupPrice
    : 0

  // Get steps based on mode (degen steps are dynamic)
  const steps = selectedMode === 'hedge'
    ? hedgeSteps
    : selectedMode === 'degen'
      ? getDegenSteps(degenConfig, positionSizeJup)
      : standardSteps

  const strategyTitle = selectedMode === 'hedge' ? 'Hedge Register' : selectedMode === 'standard' ? 'Standard Register' : 'Degen Strategy'
  const strategySubtitle = selectedMode === 'hedge' ? 'Participate in CatLumpurr 2026 for the event rewards and community benefits, not to speculate on whether JUP will go up or down during the lock-up period.' : selectedMode === 'standard' ? 'Direct Asset Deployment' : 'Leveraged Speculation'

  // Validate degen config for execute button state
  const isDegenValid = selectedMode === 'degen' && degenConfig && walletBalances
    ? validateDegenConfig(degenConfig, walletBalances).isValid
    : true

  // Degen mode requires valid config to execute
  const isDegenDisabled = selectedMode === 'degen' && (!degenConfig || !isDegenValid)

  return (
    <div className="bg-[#E4EAF2] rounded-[24px] p-4 sm:p-6 lg:p-8 relative overflow-visible transition-all duration-500 flex flex-col z-10 w-full min-w-0 max-w-full outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black]">
      {/* Tab Selector */}
      <div className="flex bg-[#EDF4F8] px-2 sm:px-3 py-2 rounded-2xl mb-4 sm:mb-5 lg:mb-6 relative z-10 gap-1 outline outline-2 outline-[#0E0F28] outline-offset-[-2px] shadow-[0px_4px_0px_#0E0F28] min-w-0">
        {/* Standard Tab */}
        <button
          onClick={() => onModeChange('standard')}
          className={`flex-1 h-12 px-2 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${selectedMode === 'standard'
            ? 'bg-[#2050F2] text-[#EDF4F8] outline outline-1 outline-[#0E0F28]'
            : 'bg-[#E4EAF2] text-[#0E0F28]'
            }`}
        >
          <ShieldCheck size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span className="hidden sm:inline">Standard</span>
          <span className="sm:hidden">Std</span>
        </button>

        {/* Hedge Tab */}
        <button
          onClick={() => onModeChange('hedge')}
          className={`flex-1 h-12 px-2 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${selectedMode === 'hedge'
            ? 'bg-[#2050F2] text-[#EDF4F8] outline outline-1 outline-[#0E0F28]'
            : 'bg-[#E4EAF2] text-[#0E0F28]'
            }`}
        >
          <Zap size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span>Hedge</span>
        </button>

        {/* Degen Tab - Now Enabled */}
        <button
          onClick={() => onModeChange('degen')}
          className={`flex-1 h-12 px-2 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${selectedMode === 'degen'
            ? 'bg-[#2050F2] text-[#EDF4F8] outline outline-1 outline-[#0E0F28]'
            : 'bg-[#E4EAF2] text-[#0E0F28]'
            }`}
        >
          <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span>Degen</span>
        </button>
      </div>

      {/* Degen Configuration Summary & Modal Trigger */}
      {selectedMode === 'degen' && degenConfig && onDegenConfigChange && (
        <div className="mb-4">
          {/* Compact settings summary */}
          <div className="bg-white rounded-xl p-3 border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {degenConfig.direction === 'long' ? (
                  <TrendingUp size={14} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
                <span className="text-xs font-bold text-[#0E0F28]">
                  {degenConfig.leverage}x {degenConfig.direction.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-[#0E0F28]/70">
                {degenConfig.collateralAmount > 0
                  ? `${degenConfig.collateralAmount} ${degenConfig.collateralToken}`
                  : 'Not configured'}
              </span>
            </div>
            {positionSizeJup > 0 && (
              <div className="text-[10px] text-[#0E0F28]/60">
                Position: {positionSizeJup.toLocaleString()} JUP (${(positionSizeJup * jupPrice).toFixed(2)})
              </div>
            )}
          </div>
          {/* Configure button */}
          <button
            onClick={() => setShowDegenModal(true)}
            className="w-full mt-2 py-2 px-4 rounded-lg bg-[#E4EAF2] text-[#0E0F28] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200"
          >
            <Settings size={14} />
            Configure Position
          </button>
        </div>
      )}

      {/* Strategy Title */}
      <div className="mb-3 sm:mb-4 lg:mb-5 relative z-10">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-black italic tracking-tight mb-1 uppercase text-[#0E0F28]">{strategyTitle}</h3>
        <p className="text-[10px] sm:text-xs text-[#0E0F28] font-bold uppercase tracking-widest">
          {strategySubtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 mb-4 sm:mb-5 relative z-10 min-h-0 overflow-y-auto pb-2">
        <div className="space-y-3 sm:space-y-4 pb-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#E4EAF2] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] flex items-start gap-2 sm:gap-3 transition-all group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 mt-1">
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider group-hover:text-[#0E0F28] truncate text-[#0E0F28]">{step.title}</h4>
                  <span className="text-[9px] sm:text-[10px] text-[#0E0F28] font-bold uppercase tracking-tighter shrink-0">{step.tag}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#0E0F28] leading-snug">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execute Button */}
      <div className="mt-auto space-y-3 sm:space-4 relative z-10">
        <button
          onClick={isCompleted ? onCopyTransferTx : onExecute}
          disabled={isLoading || isDegenDisabled}
          className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-wider sm:tracking-[0.2em] lg:tracking-[0.4em] uppercase flex items-center justify-center gap-2 sm:gap-4 transition-all duration-200 min-w-0 ${isDegenDisabled
            ? 'bg-[#E4EAF2] text-[#0E0F28]/40 outline outline-2 outline-[#0E0F28]/40 shadow-[0px_2px_0px_#0E0F28]/40 cursor-not-allowed'
            : 'bg-[#2050F2] text-white outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_#0E0F28] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_#0E0F28] active:translate-y-[1px] active:shadow-[0px_1px_0px_#0E0F28]'
            }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-[#2050F2]/20 border-t-[#2050F2] rounded-full animate-spin" />
          ) : isCompleted ? (
            <>
              <Copy size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">GET TRANSFER TX</span>
              <span className="sm:hidden">GET TX</span>
            </>
          ) : (
            <>
              {selectedMode === 'degen' ? (
                <Flame size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
              ) : (
                <Zap size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
              )}
              <span className="hidden sm:inline">EXECUTE NOW</span>
              <span className="sm:hidden">EXECUTE</span>
            </>
          )}
        </button>

        {/* Disclaimer Button - Only show for hedge mode */}
        {selectedMode === 'hedge' && (
          <button
            onClick={() => setShowDisclaimer(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Info</span>
          </button>
        )}
      </div>

      {/* Disclaimer Modal */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        mode={selectedMode}
      />

      {/* Degen Config Modal */}
      {degenConfig && onDegenConfigChange && (
        <DegenConfigModal
          isOpen={showDegenModal}
          onClose={() => setShowDegenModal(false)}
          config={degenConfig}
          onConfigChange={onDegenConfigChange}
          walletBalances={walletBalances || null}
          jupPrice={jupPrice}
          solPrice={solPrice}
          swapCost={swapCost}
        />
      )}
    </div>
  )
}
