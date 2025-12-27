import { AlertTriangle, X } from 'lucide-react'

interface DisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#E4EAF2] rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 animate-fade-in outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] z-30">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#0E0F28] hover:text-[#0E0F28] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#2050F2]/20 border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#2050F2]" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider text-[#0E0F28]">Disclaimer</h3>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-[#0E0F28] leading-relaxed">
          <p>
            <span className="font-bold text-[#2050F2]">Catpurr</span> is an independent tool developed by the <span className="font-bold text-[#2050F2]">PinTool team</span> and is <span className="font-bold text-[#0E0F28]">not affiliated</span> with the Jupiter team.
          </p>

          <p>
            This interface is provided for <span className="font-bold text-[#0E0F28]">informational purposes only</span> and does not constitute financial advice.
          </p>

          <div className="p-4 rounded-xl bg-[#E4EAF2] border-2 border-[#0E0F28] shadow-[0px_2px_0px_black]">
            <p className="font-bold text-[#2050F2] mb-2">⚠️ Using this tool involves risks:</p>
            <ul className="space-y-1 text-sm text-[#0E0F28] list-disc list-inside">
              <li>Smart contract risks</li>
              <li>Liquidation risks</li>
              <li>Market volatility</li>
            </ul>
          </div>

          <p className="font-bold text-[#0E0F28]">
            Users are solely responsible for their own investment decisions.
          </p>

          <p className="text-center text-lg font-black text-[#2050F2] uppercase tracking-widest pt-2">
            DYOR.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 px-4 rounded-xl bg-[#E4EAF2] text-[#0E0F28] font-medium outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200"
        >
          I Understand
        </button>
      </div>
    </div>
  )
}
