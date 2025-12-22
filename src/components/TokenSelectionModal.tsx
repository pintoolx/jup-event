import { useState } from 'react'
import { X, ArrowRight, Info } from 'lucide-react'

export type InputToken = 'SOL' | 'USDC'

interface TokenSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: InputToken) => void
}

const tokenOptions: { token: InputToken; label: string; description: string }[] = [
  {
    token: 'SOL',
    label: 'SOL',
    description: 'Swap SOL for JUP tokens',
  },
  {
    token: 'USDC',
    label: 'USDC',
    description: 'Swap USDC for JUP tokens',
  },
]

export function TokenSelectionModal({ isOpen, onClose, onSelect }: TokenSelectionModalProps) {
  const [selectedToken, setSelectedToken] = useState<InputToken>('SOL')

  if (!isOpen) return null

  const handleContinue = () => {
    onSelect(selectedToken)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-1">Select Input Token</h3>
          <p className="text-gray-400 text-sm">Choose which token to swap for JUP</p>
        </div>

        {/* Token Options */}
        <div className="space-y-3 mb-4">
          {tokenOptions.map((option) => (
            <button
              key={option.token}
              onClick={() => setSelectedToken(option.token)}
              className={`w-full p-4 rounded-xl border transition-all ${
                selectedToken === option.token
                  ? 'border-jup-green bg-jup-green/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Radio indicator */}
                <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                  selectedToken === option.token
                    ? 'border-jup-green'
                    : 'border-gray-500'
                }`}>
                  {selectedToken === option.token && (
                    <div className="w-2.5 h-2.5 rounded-full bg-jup-green" />
                  )}
                </div>

                {/* Token badge */}
                <div className={`px-3 py-1 flex-shrink-0 rounded-lg font-mono text-sm font-bold ${
                  option.token === 'SOL'
                  ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {option.label}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-500" />

                {/* JUP badge */}
                <div className="px-3 py-1 flex-shrink-0 rounded-lg bg-jup-green/20 text-jup-green font-mono text-sm font-bold">
                  JUP
                </div>

                {/* Description */}
                <span className="flex-1 text-right text-gray-400 text-sm whitespace-nowrap">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Drift Account Deposit Info */}
        <div className="mb-6 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sky-400 text-xs font-medium">First-time Drift User?</p>
              <p className="text-sky-400/70 text-xs mt-0.5">
                Opening a Drift account requires a one-time deposit of approximately <strong>0.03 SOL</strong> as rent.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-4 rounded-xl bg-jup-green text-jup-dark font-bold hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
