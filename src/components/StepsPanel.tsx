import { useState } from 'react'
import { Zap, Copy, AlertTriangle, ShieldCheck, Flame } from 'lucide-react'
import { ExecutionMode } from '../types'
import { DisclaimerModal } from './DisclaimerModal'

interface StepsPanelProps {
  isLoading: boolean
  isSuccess: boolean
  isCompleted: boolean
  buttonText: string
  onExecute: () => void
  onCopyTransferTx?: () => void
  selectedMode: ExecutionMode
  onModeChange: (mode: ExecutionMode) => void
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

const degenSteps = [
  {
    number: 1,
    title: 'Buy JUP',
    description: 'Swap assets to JUP via Jupiter Aggregator for best rates.',
    tag: 'Jupiter Swap',
  },
  {
    number: 2,
    title: 'Long JUP',
    description: 'Open 1x long position for leveraged exposure.',
    tag: 'Drift Protocol',
  },
  {
    number: 3,
    title: 'Send to Event',
    description: 'Transfer JUP directly to the official event vault.',
    tag: 'Transfer',
  },
]

export function StepsPanel({ isLoading, isSuccess: _isSuccess, isCompleted, buttonText: _buttonText, onExecute, onCopyTransferTx, selectedMode, onModeChange }: StepsPanelProps) {
  // Note: isSuccess and buttonText are kept for API compatibility but not currently used
  void _isSuccess
  void _buttonText
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showDegenTooltip, setShowDegenTooltip] = useState(false)
  const steps = selectedMode === 'hedge' ? hedgeSteps : selectedMode === 'degen' ? degenSteps : standardSteps
  const strategyTitle = selectedMode === 'hedge' ? 'Hedge Strategy' : selectedMode === 'standard' ? 'Standard Strategy' : 'Degen Strategy'
  const strategySubtitle = selectedMode === 'hedge' ? 'Market-Neutral Protection' : selectedMode === 'standard' ? 'Direct Asset Deployment' : 'Leveraged Speculation'

  return (
    <div className="bg-blue-950/20 border border-white/10 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden transition-all duration-500 min-h-[500px] sm:min-h-[620px] flex flex-col z-10 w-full">
      <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 text-blue-400 hidden sm:block">
        {selectedMode === 'standard' && <ShieldCheck size={160} />}
        {selectedMode === 'hedge' && <Zap size={160} />}
        {selectedMode === 'degen' && <Flame size={160} />}
      </div>

      {/* Tab Selector */}
      <div className="flex bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 border border-white/10 relative z-20">
        {/* Standard Tab */}
        <button
          onClick={() => onModeChange('standard')}
          className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab ${
            selectedMode === 'standard'
              ? 'text-white'
              : 'text-blue-400/60 hover:text-white'
          }`}
        >
          {selectedMode === 'standard' && (
            <div className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-lg sm:rounded-xl -z-10 shadow-lg" />
          )}
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <ShieldCheck size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">Standard</span>
              <span className="sm:hidden">Std</span>
            </div>
          </div>
        </button>

        {/* Hedge Tab */}
        <button
          onClick={() => onModeChange('hedge')}
          className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab ${
            selectedMode === 'hedge'
              ? 'text-white'
              : 'text-blue-400/60 hover:text-white'
          }`}
        >
          {selectedMode === 'hedge' && (
            <div className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-lg sm:rounded-xl -z-10 shadow-lg" />
          )}
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Hedge</span>
            </div>
          </div>
        </button>

        {/* Degen Tab */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowDegenTooltip(true)
            setTimeout(() => setShowDegenTooltip(false), 2000)
          }}
          onMouseEnter={() => setShowDegenTooltip(true)}
          onMouseLeave={() => setShowDegenTooltip(false)}
          className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab text-blue-400/40 cursor-not-allowed"
        >
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Degen</span>
            </div>
          </div>

          {/* Tooltip */}
          {showDegenTooltip && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg border border-white/10 z-30 animate-fade-in">
              Coming Soon
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-white/10" />
            </div>
          )}
        </button>
      </div>

      {/* Strategy Title */}
      <div className="mb-6 sm:mb-8 relative z-10">
        <h3 className="text-xl sm:text-2xl font-black italic tracking-tight mb-1 uppercase text-white">{strategyTitle}</h3>
        <p className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-widest">
          {strategySubtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 mb-6 relative z-10 min-h-[360px] sm:min-h-[400px]">
        <div className="space-y-3 sm:space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] bg-blue-950/20 border border-white/5 flex items-start gap-3 sm:gap-4 hover:border-white/10 transition-all group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#000814] flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 mt-1 shadow-lg shadow-blue-500/10">
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider group-hover:text-white truncate">{step.title}</h4>
                  <span className="text-[9px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-tighter shrink-0">{step.tag}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-blue-200/40 leading-snug">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execute Button */}
      <div className="mt-auto space-y-4 sm:space-y-6 relative z-10">
        <button
          onClick={isCompleted ? onCopyTransferTx : onExecute}
          disabled={isLoading}
          className="w-full relative group transition-all duration-300 active:scale-[0.98]"
        >
          <div className={`absolute -inset-1 rounded-xl sm:rounded-2xl blur-xl opacity-20 transition-opacity ${
            selectedMode === 'standard' ? 'bg-blue-400 group-hover:opacity-50' :
            selectedMode === 'hedge' ? 'bg-blue-300 group-hover:opacity-50' :
            'bg-orange-400 group-hover:opacity-50'
          }`} />

          <div className="relative py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-[0.2em] sm:tracking-[0.4em] uppercase flex items-center justify-center gap-2 sm:gap-4 shadow-2xl overflow-hidden transition-all border bg-white text-[#000814] border-white/20">
            {isLoading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
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
            {!isLoading && (
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] group-hover:left-[150%] transition-all duration-1000" />
            )}
          </div>
        </button>

        {/* Disclaimer Button */}
        <button
          onClick={() => setShowDisclaimer(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-t border-white/5 hover:bg-white/5 transition-all group"
        >
          <AlertTriangle className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
          <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-wider">
            Important Disclaimer
          </span>
        </button>

        {/* Disclaimer Modal */}
        <DisclaimerModal
          isOpen={showDisclaimer}
          onClose={() => setShowDisclaimer(false)}
        />
      </div>
    </div>
  )
}
