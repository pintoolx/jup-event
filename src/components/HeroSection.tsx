import { StrategyCarousel } from './StrategyCarousel'

export function HeroSection() {
  return (
    <div className="flex flex-col justify-center w-full h-full">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-3 sm:mb-4 lg:mb-5 italic text-[#0E0F28]">
        What is Catpurr<span className="text-[#2050F2]">?</span>
      </h1>
      
      {/* Description */}
      <div className="space-y-2 sm:space-y-3 text-[#0E0F28] text-xs sm:text-sm leading-relaxed font-medium mb-4 sm:mb-5">
        <p>
          Catpurr is a specialized utility designed for Jupiter's <span className="text-[#2050F2] font-bold italic">CatLumpurr 2026</span>.
        </p>
        <p>
          Participation requires sending <span className="text-[#0E0F28]">250 JUP</span> to Jupiter's official event address, with assets returned post-event. Catpurr provides a seamless, one-stop platform for participants to manage their JUP strategy according to their own risk preference.
        </p>
        <p className="text-[#0E0F28] font-black italic tracking-tight text-sm sm:text-base lg:text-lg mt-2 sm:mt-3">
          Get ready to CatLumpurr together!
        </p>
      </div>

      {/* Event Cards - Horizontal Layout */}
      <div className="flex gap-2 sm:gap-3">
        {/* Event Luma Page */}
        <a
          href="https://lu.ma/7f1gdren?tk=kQ8qKF"
          target="_blank"
          rel="noopener noreferrer"
          className="event-card group flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 bg-[#2050F2]/10 hover:border-[#2050F2]/30 transition-all cursor-pointer shadow-sm"
        >
          <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest group-hover:text-[#0E0F28] transition-colors text-center text-[#0E0F28]">Event Luma Page</h3>
        </a>

        {/* Apply for Subsidy */}
        <a
          href="https://airtable.com/app99T2lXOgDkK293/pagOV4Up7BdhLFHoF/form"
          target="_blank"
          rel="noopener noreferrer"
          className="event-card group flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 bg-[#2050F2]/10 hover:border-[#2050F2]/30 transition-all cursor-pointer shadow-sm"
        >
          <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors text-center">Apply for Subsidy</h3>
        </a>
      </div>

      {/* Strategy Carousel */}
      <StrategyCarousel />
    </div>
  )
}
