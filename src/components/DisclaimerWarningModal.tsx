interface DisclaimerWarningModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DisclaimerWarningModal({ isOpen, onClose }: DisclaimerWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-lg shadow-2xl outline outline-2 outline-[#0E0F28] p-4 sm:p-6 max-h-[80vh] overflow-y-auto w-full max-w-2xl">
        <div className="space-y-4 text-[#0E0F28]">
          {/* Title and Close Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Catpurr - Disclaimers
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close disclaimer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Important Disclaimers */}
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-bold">
              Important Disclaimers
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="font-bold mb-1">Not an Official Jupiter Product</p>
                <p className="text-[#0E0F28]/80">
                  Catpurr is an independent, community-built tool created by Jupiter enthusiasts who also participated in Catstanbul. This platform is not officially affiliated with, endorsed by, or developed by Jupiter Exchange.
                </p>
              </div>

              <div>
                <p className="font-bold mb-1">Community Initiative & Seeking Partnership</p>
                <p className="text-[#0E0F28]/80">
                  We are passionate supporters of Jupiter events and built this tool to help fellow participants. We are actively seeking collaboration with Jupiter and are open to code reviews, security audits, and partnership discussions. However, as of now, this remains an independent community project.
                </p>
              </div>

              <div>
                <p className="font-bold mb-1">Use at Your Own Risk</p>
                <p className="text-[#0E0F28]/80">
                  This tool is provided "as-is" without any warranties. By using Catpurr, you acknowledge and accept all risks associated with cryptocurrency transactions and third-party tools.
                </p>
              </div>
            </div>
          </div>

          {/* Critical Safety Warnings */}
          <div className="space-y-3 bg-red-50 p-3 rounded-lg border-2 border-red-200">
            <h4 className="text-sm sm:text-base font-bold text-red-700">
              Critical Safety Warnings
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              <div>
                <p className="font-bold mb-1 text-red-700">Always Verify Addresses</p>
                <p className="font-bold text-red-600 mb-1">MOST IMPORTANT: Before sending any tokens, always verify:</p>
                <ul className="list-none space-y-1 text-[#0E0F28]/80 ml-2">
                  <li>✅ Double-check the recipient address against Jupiter's official announcement</li>
                  <li>✅ Verify event details on Jupiter's official channels (website, Twitter, Discord)</li>
                  <li>✅ Never send funds to addresses you haven't independently verified</li>
                </ul>
                <p className="font-bold text-red-600 mt-2">We are not responsible for funds sent to incorrect addresses.</p>
              </div>
            </div>
          </div>

          {/* Key Risks */}
          <div className="space-y-2 text-xs sm:text-sm">
            <p className="font-bold">Key Risks to Be Aware Of</p>

            <div className="space-y-2 text-[#0E0F28]/80">
              <div>
                <p className="font-semibold text-[#0E0F28]">2. Transaction Risks</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>All blockchain transactions are irreversible</li>
                  <li>Carefully review all transaction details before confirming</li>
                  <li>Make sure the target address is verified</li>
                  <li>Network issues may cause delays or failures</li>
                  <li>You are responsible for all gas fees and transaction costs</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-[#0E0F28]">3. Security Risks</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>Always verify you're on the correct website URL</li>
                  <li>Beware of phishing sites and fake platforms</li>
                  <li>Use secure devices and networks</li>
                  <li>Never share your private keys or seed phrases</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-[#0E0F28]">4. Slippage & Loss Risks</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>Transactions may experience slippage due to market volatility</li>
                  <li>You may receive less than expected due to price movements</li>
                  <li>Market conditions change rapidly and can result in losses</li>
                  <li>Always set appropriate slippage tolerance for your trades</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-[#0E0F28]">5. No Guarantees</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  <li>We make no guarantees about platform performance or accuracy</li>
                  <li>Features may change or be discontinued</li>
                  <li>Support may be limited as this is a community project</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How to Stay Safe */}
          <div className="space-y-2 text-xs sm:text-sm bg-green-50 p-3 rounded-lg border-2 border-green-200">
            <p className="font-bold text-green-700">✅ How to Stay Safe</p>
            <ul className="list-disc ml-5 space-y-1 text-[#0E0F28]/80">
              <li><span className="font-semibold text-[#0E0F28]">Verify Everything:</span> Cross-check all event details with Jupiter's official sources</li>
              <li><span className="font-semibold text-[#0E0F28]">Test First:</span> Start with small amounts before committing large funds</li>
              <li><span className="font-semibold text-[#0E0F28]">Check Addresses:</span> Triple-check recipient addresses before sending</li>
              <li><span className="font-semibold text-[#0E0F28]">Stay Updated:</span> Follow official Jupiter announcements for event updates</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full p-3 sm:p-4 rounded-xl bg-[#2050F2] text-white font-bold uppercase tracking-wide hover:bg-[#1a40c2] transition-colors shadow-[0px_2px_0px_black] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
