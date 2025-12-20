import { ListChecks, ArrowLeftRight, TrendingUp, Send, Zap } from 'lucide-react'

interface StepsPanelProps {
  isLoading: boolean
  isSuccess: boolean
  buttonText: string
  onExecute: () => void
}

const steps = [
  {
    number: 1,
    title: 'Buy JUP',
    description: 'Swap SOL or USDC to JUP via Jupiter Aggregator for best rates.',
    tag: 'Jupiter Swap',
    colorClass: 'yellow',
    icon: ArrowLeftRight,
  },
  {
    number: 2,
    title: 'Short JUP',
    description: 'Open 1x short position to neutralize price volatility risk.',
    tag: 'Drift Protocol',
    colorClass: 'purple',
    icon: TrendingUp,
  },
  {
    number: 3,
    title: 'Send to Event',
    description: 'Transfer hedged JUP directly to the event participation address.',
    tag: 'Transfer',
    colorClass: 'jup',
    icon: Send,
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; tagBg: string }> = {
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    tagBg: 'bg-yellow-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    tagBg: 'bg-purple-500/20',
  },
  jup: {
    bg: 'bg-jup-green/10',
    text: 'text-jup-green',
    border: 'border-jup-green/30',
    tagBg: 'bg-jup-green/20',
  },
}

export function StepsPanel({ isLoading, isSuccess, buttonText, onExecute }: StepsPanelProps) {
  return (
    <div className="glass-panel rounded-3xl p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-jup-green/10 flex items-center justify-center">
          <ListChecks className="w-6 h-6 text-jup-green" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">How It Works</h2>
          <p className="text-gray-500 text-sm">3 steps, 1 signature</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const colors = colorMap[step.colorClass]
          const Icon = step.icon
          const isLast = index === steps.length - 1
          
          return (
            <div 
              key={step.number} 
              className={`step-card rounded-2xl p-5 cursor-default ${!isLast ? 'flow-line' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div 
                  className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center font-bold text-lg border ${colors.border}`}
                >
                  {step.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${colors.tagBg} ${colors.text} font-mono`}>
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
                <div className={colors.text}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Execute Button */}
      <div className="mt-8">
        <button 
          onClick={onExecute}
          disabled={isLoading}
          className={`execute-btn w-full py-4 px-8 rounded-xl text-lg flex items-center justify-center gap-3 ${isSuccess ? 'btn-success' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              <span>{buttonText}</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
        <p className="text-center text-gray-500 text-xs mt-4 flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">i</span>
          Atomic execution for seamless experience. Requires Phantom Wallet.
        </p>
      </div>
    </div>
  )
}
