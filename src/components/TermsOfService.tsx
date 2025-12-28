import { X, FileText } from 'lucide-react'

interface TermsOfServiceProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsOfService({ isOpen, onClose }: TermsOfServiceProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#E4EAF2] rounded-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in outline outline-2 outline-[#0E0F28] shadow-[0px_4px_0px_black] scrollbar-custom">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#0E0F28] hover:text-[#2050F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#2050F2]/20 border-2 border-[#0E0F28] shadow-[0px_2px_0px_black] flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#2050F2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-[#0E0F28]">Terms of Service</h2>
            <p className="text-xs text-[#0E0F28]/70 font-bold">Last Updated: December 28, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-[#0E0F28] leading-relaxed">
          <p>
            Welcome to <span className="font-bold text-[#2050F2]">Catpurr PinTool</span> (catpurr.pintool.fun). By accessing or using our website and services, you agree to be bound by the following Terms of Service. If you do not agree to these terms, please do not use our tool.
          </p>

          {/* Section 1 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">1. Nature of Service</h3>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Free Tool:</span> Catpurr PinTool is a free-to-use helper utility designed to streamline operations on the Catlumpurr platform.
              </li>
              <li>
                <span className="font-bold">Integration:</span> Our tool integrates with the Jupiter (jup.ag) and Drift Protocol (drift.trade) Software Development Kits (SDKs) to execute on-chain instructions.
              </li>
              <li>
                <span className="font-bold">Non-Custodial:</span> We are a non-custodial interface. <span className="font-bold text-[#2050F2]">We do not custody any money. We do not store, manage, or have access to your private keys or funds</span>. All transactions are executed directly from your wallet to the protocols and are signed and authorized by you through your own wallet provider.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">2. Risks & Third-Party Dependencies</h3>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Third-Party Protocols:</span> This tool relies entirely on the availability and integrity of Jupiter, Drift, and the Solana blockchain. We are not responsible for any failures, smart contract exploits, or service interruptions originating from these third-party protocols.
              </li>
              <li>
                <span className="font-bold">Blockchain Risks:</span> Transactions on the blockchain are irreversible. You acknowledge that network congestion, high slippage, or delayed price feeds may result in unfavorable trade execution.
              </li>
              <li>
                <span className="font-bold">No Financial Advice:</span> Any data or features provided by this tool are for informational and convenience purposes only and do not constitute financial or investment advice.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">3. User Responsibilities</h3>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Parameter Verification:</span> You are solely responsible for verifying all order parameters (e.g., amount, leverage, price, slippage) before signing a transaction.
              </li>
              <li>
                <span className="font-bold">Security:</span> You are responsible for the security of your wallet and recovery phrases. Never share your private key with anyone.
              </li>
              <li>
                <span className="font-bold">Compliance:</span> You agree to use this tool in compliance with all applicable local laws and the terms of the underlying protocols (Jupiter, Drift, and Catlumpurr).
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">4. Disclaimer of Warranties</h3>
            <p className="mb-3">
              Catpurr PinTool is provided on an <span className="font-bold">"AS IS"</span> and <span className="font-bold">"AS AVAILABLE"</span> basis. To the maximum extent permitted by law, the developers disclaim all warranties, whether express or implied. We do not guarantee that the tool will be:
            </p>
            <ul className="space-y-1 ml-4 list-disc list-inside">
              <li>Free of bugs, errors, or interruptions.</li>
              <li>Always accurate in displaying real-time market data.</li>
              <li>Compatible with every wallet or browser.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">5. Limitation of Liability</h3>
            <p>
              In no event shall the developers of Catpurr PinTool be liable for any damages whatsoever, including but not limited to financial losses, loss of digital assets, or indirect damages arising out of the use or inability to use this tool, even if advised of the possibility of such damages. <span className="font-bold text-[#2050F2]">You use this tool at your own risk</span>.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">6. Fees</h3>
            <p className="mb-3">
              <span className="font-bold text-[#2050F2]">Catpurr PinTool does not charge a platform fee</span>. However, users are still responsible for paying:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Network Fees:</span> Solana gas fees (Lamports).
              </li>
              <li>
                <span className="font-bold">Protocol Fees:</span> Any trading or swap fees charged by Jupiter or Drift Protocol.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">7. Modifications</h3>
            <p>
              We reserve the right to modify or discontinue the service at any time without prior notice. These terms may be updated periodically, and your continued use of the tool constitutes acceptance of the new terms.
            </p>
          </section>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 py-3 px-4 rounded-xl bg-[#2050F2] text-white font-bold uppercase tracking-wider outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}
