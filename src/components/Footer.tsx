import { useState } from 'react'
import { PrivacyPolicy } from './PrivacyPolicy'
import { TermsOfService } from './TermsOfService'

export function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  return (
    <>
      <footer className="relative z-10 border-t border-white/5 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[#0E0F28] text-xs">
                &copy; {new Date().getFullYear()} PinTool. All rights reserved.
              </p>
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-[#0E0F28] text-xs hover:text-[#2050F2] transition-colors font-bold underline"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="text-[#0E0F28] text-xs hover:text-[#2050F2] transition-colors font-bold underline"
              >
                Terms of Service
              </button>
            </div>

            <a
              href="https://x.com/PinToolX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0E0F28] hover:text-[#2050F2] transition-colors duration-300"
            >
              <span className="sr-only">Follow us on X (Twitter)</span>
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {/* Terms of Service Modal */}
      <TermsOfService isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  )
}
