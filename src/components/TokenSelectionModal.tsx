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
      <div className="relative bg-[#E4EAF2] rounded-2xl p-4 sm:p-6 w-full max-w-md mx-4 animate-fade-in outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#0E0F28] hover:text-[#0E0F28] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black uppercase tracking-wider text-[#0E0F28] mb-1">Select Input Token</h3>
          <p className="text-[#0E0F28] text-sm">Choose which token to swap for JUP</p>
        </div>

        {/* Token Options */}
        <div className="space-y-3 mb-4">
          {tokenOptions.map((option) => (
            <button
              key={option.token}
              onClick={() => setSelectedToken(option.token)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedToken === option.token
                  ? 'border-[#0E0F28] bg-[#2050F2]/10 shadow-[0px_2px_0px_black]'
                  : 'border-[#0E0F28] bg-[#E4EAF2] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Radio indicator */}
                <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                  selectedToken === option.token
                    ? 'border-[#0E0F28] bg-[#2050F2]'
                    : 'border-[#0E0F28] bg-[#E4EAF2]'
                }`}>
                  {selectedToken === option.token && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>

                {/* Token badge */}
                <div className={`px-2 sm:px-3 py-1 flex-shrink-0 rounded-lg font-mono text-xs sm:text-sm font-bold border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] ${
                  option.token === 'SOL'
                  ? 'bg-[#2050F2] text-white'
                    : 'bg-[#2050F2] text-white'
                }`}>
                  {option.label}
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-[#0E0F28]" />

                {/* JUP badge */}
                <div className="px-2 sm:px-3 py-1 flex-shrink-0 rounded-lg bg-[#2050F2] text-white font-mono text-xs sm:text-sm font-bold border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
                  JUP
                </div>

                {/* Description */}
                <span className="flex-1 text-right text-[#0E0F28] text-xs sm:text-sm min-w-0 break-words sm:whitespace-nowrap sm:pl-2">
                  {option.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Drift Account Deposit Info */}
        <div className="mb-6 p-3 rounded-xl bg-[#E4EAF2] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#2050F2] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#2050F2] text-xs font-bold">First-time Drift User?</p>
              <p className="text-[#0E0F28] text-xs mt-0.5">
                Opening a Drift account requires a one-time deposit of approximately <strong>0.03 SOL</strong> as rent.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-[#E4EAF2] text-[#0E0F28] font-medium outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2050F2] text-white font-medium outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_#0E0F28] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_#0E0F28] active:translate-y-[1px] active:shadow-[0px_1px_0px_#0E0F28] transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
