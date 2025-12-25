import { Zap, Copy, AlertTriangle, ShieldCheck, Flame } from 'lucide-react'
import { useState } from 'react'

interface StepsPanelProps {
  isLoading: boolean
  isSuccess: boolean
  isCompleted: boolean
  buttonText: string
  onExecute: () => void
  onCopyTransferTx?: () => void
}

type StrategyTab = 'standard' | 'hedge' | 'degen'

const hedgeSteps = [
  {
    number: 1,
    title: 'Buy JUP',
    description: 'Swap assets to JUP via Jupiter Aggregator for best rates.',
    tag: 'Jupiter Swap',
  },
  {
    number: 2,
    title: 'Short JUP',
    description: 'Open 1x short position to neutralize price risk.',
    tag: 'Drift Protocol',
  },
  {
    number: 3,
    title: 'Send to Event',
    description: 'Transfer hedged JUP directly to the official event vault.',
    tag: 'Transfer',
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
]

export function StepsPanel({ isLoading, isSuccess, isCompleted, buttonText, onExecute, onCopyTransferTx }: StepsPanelProps) {
  const [activeTab, setActiveTab] = useState<StrategyTab>('hedge')
  
  const steps = activeTab === 'hedge' ? hedgeSteps : standardSteps
  const strategyTitle = activeTab === 'hedge' ? 'Hedge Strategy' : activeTab === 'standard' ? 'Standard Strategy' : 'Degen Strategy'
  const strategySubtitle = activeTab === 'hedge' ? 'Market-Neutral Protection' : activeTab === 'standard' ? 'Direct Asset Deployment' : 'Leveraged Speculation'

  return (
    <div className="bg-blue-950/20 border border-white/10 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden transition-all duration-500 min-h-[500px] sm:min-h-[620px] flex flex-col z-10 w-full">
      <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 text-blue-400 hidden sm:block">
        {activeTab === 'standard' && <ShieldCheck size={160} />}
        {activeTab === 'hedge' && <Zap size={160} />}
        {activeTab === 'degen' && <Flame size={160} />}
      </div>

      {/* Tab Selector */}
      <div className="flex bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 border border-white/10 relative z-20">
        {/* Standard Tab */}
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab ${
            activeTab === 'standard' 
              ? 'text-white' 
              : 'text-blue-400/60 hover:text-white'
          }`}
        >
          {activeTab === 'standard' && (
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
          onClick={() => setActiveTab('hedge')}
          className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab ${
            activeTab === 'hedge' 
              ? 'text-white' 
              : 'text-blue-400/60 hover:text-white'
          }`}
        >
          {activeTab === 'hedge' && (
            <div className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-lg sm:rounded-xl -z-10 shadow-lg" />
          )}
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Hedge</span>
            </div>
          </div>
        </button>

        {/* Degen Tab (Coming Soon) */}
        <div className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group/tab text-blue-900/40 cursor-not-allowed">
          <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Degen</span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold text-blue-800 tracking-normal">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Strategy Title */}
      <div className="mb-6 sm:mb-8 relative z-10">
        <h3 className="text-xl sm:text-2xl font-black italic tracking-tight mb-1 uppercase text-white">{strategyTitle}</h3>
        <p className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-widest">
          {strategySubtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 space-y-3 sm:space-y-4 mb-6 relative z-10">
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

      {/* Execute Button */}
      <div className="mt-auto space-y-4 sm:space-y-6 relative z-10">
        <button
          onClick={isCompleted ? onCopyTransferTx : onExecute}
          disabled={isLoading || activeTab === 'degen'}
          className={`w-full relative group transition-all duration-300 ${
            activeTab === 'degen' ? 'cursor-not-allowed opacity-50 grayscale' : 'active:scale-[0.98]'
          }`}
        >
          <div className={`absolute -inset-1 rounded-xl sm:rounded-2xl blur-xl opacity-20 transition-opacity ${
            activeTab === 'standard' ? 'bg-blue-400 group-hover:opacity-50' : 
            activeTab === 'hedge' ? 'bg-blue-300 group-hover:opacity-50' : 
            'bg-white/10 opacity-0'
          }`} />
          
          <div className={`relative py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-[0.2em] sm:tracking-[0.4em] uppercase flex items-center justify-center gap-2 sm:gap-4 shadow-2xl overflow-hidden transition-all border ${
            activeTab === 'degen' 
              ? 'bg-white/5 text-blue-900 border-white/5' 
              : 'bg-white text-[#000814] border-white/20'
          }`}>
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
                <Zap size={18} className="sm:w-5 sm:h-5" fill={activeTab === 'degen' ? 'none' : 'currentColor'} />
                {activeTab === 'degen' ? 'LOCKED' : (
                  <>
                    <span className="hidden sm:inline">EXECUTE NOW</span>
                    <span className="sm:hidden">EXECUTE</span>
                  </>
                )}
              </>
            )}
            {activeTab !== 'degen' && !isLoading && (
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] group-hover:left-[150%] transition-all duration-1000" />
            )}
          </div>
        </button>

        {/* Disclaimer */}
        <div className="opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex gap-2 sm:gap-3 items-start border-t border-white/5 pt-3 sm:pt-4">
            <AlertTriangle size={10} className="sm:w-3 sm:h-3 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-500">Disclaimer</h4>
              <p className="text-[7px] sm:text-[8px] text-blue-200/50 leading-relaxed font-medium">
                Catpurr is an independent tool developed by the <span className="text-blue-300">PinTool team</span> and is not affiliated with the Jupiter team. This interface is provided for informational purposes only and does not constitute financial advice. Using this tool involves risks including smart contract risks, liquidation risks, and market volatility. Users are solely responsible for their own investment decisions. <span className="text-blue-300 uppercase tracking-tighter font-black">DYOR.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
