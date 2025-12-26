import { AlertTriangle, X } from 'lucide-react'

interface DisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Disclaimer</h3>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-blue-100/80 leading-relaxed">
          <p>
            <span className="font-bold text-blue-300">Catpurr</span> is an independent tool developed by the <span className="font-bold text-blue-300">PinTool team</span> and is <span className="font-bold text-white">not affiliated</span> with the Jupiter team.
          </p>

          <p>
            This interface is provided for <span className="font-bold text-white">informational purposes only</span> and does not constitute financial advice.
          </p>

          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="font-bold text-orange-300 mb-2">⚠️ Using this tool involves risks:</p>
            <ul className="space-y-1 text-sm text-orange-200/80 list-disc list-inside">
              <li>Smart contract risks</li>
              <li>Liquidation risks</li>
              <li>Market volatility</li>
            </ul>
          </div>

          <p className="font-bold text-white">
            Users are solely responsible for their own investment decisions.
          </p>

          <p className="text-center text-lg font-black text-blue-300 uppercase tracking-widest pt-2">
            DYOR.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 px-4 rounded-xl font-bold bg-blue-500/20 text-white hover:bg-blue-500/30 transition-all border border-blue-500/30"
        >
          I Understand
        </button>
      </div>
    </div>
  )
}
