import { StrategyCarousel } from './StrategyCarousel'
import { DisclaimerWarningModal } from './DisclaimerWarningModal'
import { useState } from 'react'

export function HeroSection() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  return (
    <div className="flex flex-col justify-center w-full min-w-0 max-w-full">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-3 sm:mb-4 lg:mb-5 italic text-[#0E0F28]">
        What is Catpurr<span className="text-[#2050F2]">?</span>
      </h1>

      {/* Description */}
      <div className="space-y-2 sm:space-y-3 text-[#0E0F28] text-xs sm:text-sm leading-relaxed font-medium mb-4 sm:mb-5 break-words">
        <p>
          When we attended <span className="font-bold italic">Catstanbul</span> earlier this year, we were captivated by the energy. The "LFG" spirit wasn't just a meme; it was palpable in every conversation and interaction. We loved the vibe—the speed, the innovation, and the relentless drive of the Jupiter community.
        </p>

        <p>
          But amidst that excitement, we noticed a disconnect. The reality of Web3 UX often drags that energy down. To participate in ecosystem events, users are still forced through a maze of repetitive tasks—switching tabs, managing wallets, and manually filling out forms.
        </p>

        <p>
          <span className="font-bold">We built Catpurr to bridge this gap</span>, merging the electric spirit of Catstanbul with our philosophy at PinTool: technology should empower, not encumber.
        </p>

        <p>
          Designed specifically for the upcoming <span className="text-[#2050F2] font-bold italic">CatLumpurr 2026</span>, Catpurr transforms the preparation process. Participation requires a <span className="font-bold">250 JUP</span> deposit, but instead of a fragmented manual process, we've created a seamless, one-stop platform. You can now manage your JUP strategy for deposit according to your own risk preference in le, efficient workflow.
        </p>

        <p>
          We are obsessed with automation because we believe your most valuable asset is your time. You should be free to focus on the event and the community, while the software handles the rest.
        </p>

        <p className="text-[#0E0F28] font-black italic tracking-tight text-sm sm:text-base lg:text-lg">
          Catpurr is our movement toward a more efficient, intent-centric experience.
        </p>

        <p className="text-[#0E0F28]/80 italic text-[11px] sm:text-xs border-t border-[#0E0F28]/20 pt-2 mt-2">
          <span className="font-bold">Note:</span> Catpurr is a community-built tool from the team at PinTool, created by Jupiter enthusiasts for the love of the community. It is not officially affiliated with Jupiter. Please read the full disclaimers on the platform.
        </p>
      </div>

      {/* Event Cards - Horizontal Layout */}
      <div className="flex gap-2 sm:gap-3">
        {/* Event Luma Page */}
        <a
          href="https://lu.ma/7f1gdren?tk=kQ8qKF"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 cursor-pointer"
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center text-[#0E0F28]">Event Luma Page</h3>
        </a>

        {/* Apply for Subsidy */}
        <a
          href="https://airtable.com/app99T2lXOgDkK293/pagOV4Up7BdhLFHoF/form"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E4EAF2] text-[#0E0F28] outline outline-2 outline-[#0E0F28] shadow-[0px_2px_0px_black] hover:-translate-y-[1px] hover:shadow-[0px_3px_0px_black] active:translate-y-[1px] active:shadow-[0px_1px_0px_black] transition-all duration-200 cursor-pointer"
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center text-[#0E0F28]">Apply for Subsidy</h3>
        </a>
      </div>

      {/* Disclaimer Warning */}
      <div className="relative mt-3 sm:mt-4">
        <button
          onClick={() => setShowDisclaimer(true)}
          className="group inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] sm:text-xs font-bold text-yellow-700 uppercase tracking-wide">
            Disclaimer
          </span>
        </button>

        <DisclaimerWarningModal
          isOpen={showDisclaimer}
          onClose={() => setShowDisclaimer(false)}
        />
      </div>

      {/* Strategy Carousel */}
      <StrategyCarousel />
    </div>
  )
}
