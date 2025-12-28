import { X, Shield } from 'lucide-react'

interface PrivacyPolicyProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
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
            <Shield className="w-6 h-6 text-[#2050F2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-[#0E0F28]">Privacy Policy</h2>
            <p className="text-xs text-[#0E0F28]/70 font-bold">Effective Date: December 28, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-[#0E0F28] leading-relaxed">
          <p>
            Welcome to <span className="font-bold text-[#2050F2]">Catpurr PinTool</span> (catpurr.pintool.fun). Your privacy and the security of your assets are our top priorities. This Privacy Policy explains how we collect, use, and protect your information when you use our automation tools for Catlumpurr.
          </p>

          {/* Section 1 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">1. Information We Collect</h3>
            <p className="mb-3">
              To provide a seamless automation and order management experience, we collect the following types of information:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Wallet Information:</span> We collect your public wallet address to identify your account and display your relevant data. We <span className="font-bold text-[#2050F2]">never collect or store your Private Keys or Seed Phrases</span>.
              </li>
              <li>
                <span className="font-bold">Order & Trading Data:</span> We store information related to the orders you place through our tool, including order parameters, timing, and status, to help you manage your activities on Catlumpurr.
              </li>
              <li>
                <span className="font-bold">Account Credentials:</span> If you create a local account to save your preferences, we store your username and encrypted login credentials.
              </li>
              <li>
                <span className="font-bold">Technical Logs:</span> We may collect basic technical data (such as IP addresses and browser types) for security monitoring and to prevent bot abuse.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">2. How We Use Your Information</h3>
            <p className="mb-3">
              We use the collected information solely for the following purposes:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Service Delivery:</span> To facilitate easier access and operation of the Catlumpurr platform.
              </li>
              <li>
                <span className="font-bold">Order Management:</span> To allow you to track, view, and manage your automated "order opening" history.
              </li>
              <li>
                <span className="font-bold">Security:</span> To protect our users from unauthorized access and ensure the integrity of the tool.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">3. Data Security & Storage</h3>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Non-Custodial:</span> Our tool is non-custodial. <span className="font-bold text-[#2050F2]">We do not have access to your funds</span>. All transactions require your explicit authorization via your connected wallet.
              </li>
              <li>
                <span className="font-bold">Encryption:</span> Sensitive data (such as API parameters or account info) is stored using industry-standard encryption.
              </li>
              <li>
                <span className="font-bold">Data Minimization:</span> We only store what is strictly necessary for the tool to function.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">4. Information Sharing</h3>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Third-Party Platforms:</span> Your data is shared with the Catlumpurr platform only as required to execute your commands and orders.
              </li>
              <li>
                <span className="font-bold">No Third-Party Sales:</span> We do not sell, trade, or rent your personal information or trading habits to third-party advertisers or data brokers.
              </li>
              <li>
                <span className="font-bold">Legal Requirements:</span> We may disclose information if required by law or to protect the safety and rights of our users.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">5. Your Rights</h3>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Access & Export:</span> View the data we have stored regarding your account and orders.
              </li>
              <li>
                <span className="font-bold">Deletion:</span> Request the permanent deletion of your account and all associated data from our database.
              </li>
              <li>
                <span className="font-bold">Disconnect:</span> You can revoke our tool's access to your wallet at any time through your wallet provider (e.g., OKX Wallet, Phantom).
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">6. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our services or legal requirements. We encourage you to review this page periodically.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0E0F28] mb-3">7. Contact Us</h3>
            <p className="mb-3">
              If you have any questions or concerns regarding your privacy, please reach out to us via our official channels:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-bold">Twitter/X:</span>{' '}
                <a
                  href="https://x.com/PinToolX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2050F2] hover:underline font-bold"
                >
                  @PinToolX
                </a>
              </li>
            </ul>
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
