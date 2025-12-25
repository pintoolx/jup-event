import { FileText, MapPin, ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <div className="flex flex-col justify-start lg:justify-center py-0 lg:py-0 w-full">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-6 sm:mb-8 italic text-white">
        What is Catpurr<span className="text-blue-500">?</span>
      </h1>
      
      {/* Description */}
      <div className="space-y-4 sm:space-y-6 text-blue-100/60 text-xs sm:text-sm leading-relaxed font-medium mb-6">
        <p>
          Catpurr is a specialized utility designed for Jupiter's <span className="text-blue-400 font-bold italic">CatLumpurr 2026</span>.
        </p>
        <p>
          Participation requires sending <span className="text-white">250 JUP</span> to Jupiter's official event address, with assets returned post-event. Catpurr provides a seamless, one-stop platform for participants to manage their JUP strategy according to their own risk preference.
        </p>
        <p className="text-white font-black italic tracking-tight text-base sm:text-lg mt-4">
          Get ready to CatLumpurr together!
        </p>
      </div>

      {/* Event Cards */}
      <div className="space-y-3">
        {/* Event Luma Page */}
        <a
          href="https://lu.ma/7f1gdren?tk=kQ8qKF"
          target="_blank"
          rel="noopener noreferrer"
          className="event-card group block p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent hover:border-blue-500/30 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest group-hover:text-white transition-colors">Event Luma Page</h3>
            </div>
            <ArrowRight size={14} className="sm:w-4 sm:h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-base sm:text-lg font-black italic mb-1 text-white group-hover:text-blue-400 transition-colors">CATLUMPURR '26 - Kuala Lumpur</p>
          <p className="text-[10px] sm:text-xs text-blue-200/40 font-medium tracking-tight">Visit the official portal for registration and event details.</p>
        </a>

        {/* Apply for Subsidy */}
        <a
          href="https://airtable.com/app99T2lXOgDkK293/pagOV4Up7BdhLFHoF/form"
          target="_blank"
          rel="noopener noreferrer"
          className="event-card group block p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent hover:border-blue-500/30 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest group-hover:text-white transition-colors">Apply for Subsidy</h3>
            </div>
            <ArrowRight size={14} className="sm:w-4 sm:h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-[10px] sm:text-xs text-blue-200/40 font-medium">Submit application for travel and event participation support.</p>
        </a>
      </div>
    </div>
  )
}
