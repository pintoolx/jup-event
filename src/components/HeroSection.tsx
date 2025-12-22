import { ExternalLink, Mail, FileText } from 'lucide-react'

export function HeroSection() {
  return (
    <div className="text-center mb-16">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
        <span className="jup-gradient">Catpurr</span>
      </h1>
      
      <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
        Get ready to CatLumpurr together!
      </p>

      {/* Event Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        {/* Luma Event Registration */}
        <div className="flex flex-col items-center">
          <a
            href="https://lu.ma/7f1gdren?tk=kQ8qKF"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-jup-green/10 hover:bg-jup-green/20 border-2 border-jup-green/50 hover:border-jup-green rounded-lg text-jup-green font-semibold transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            CATLUMPURR '26 - Kuala Lumpur
          </a>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Register with your email for detailed event info
          </p>
        </div>

        {/* Subsidy Application */}
        <div className="flex flex-col items-center">
          <a
            href="https://airtable.com/app99T2lXOgDkK293/pagOV4Up7BdhLFHoF/form"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500/10 hover:bg-sky-500/20 border-2 border-sky-500/50 hover:border-sky-500 rounded-lg text-sky-400 font-semibold transition-all"
          >
            <FileText className="w-5 h-5" />
            Apply for Subsidy
          </a>
          <p className="text-gray-500 text-xs mt-2">
            Fill out the form to apply for event subsidy
          </p>
        </div>
      </div>
    </div>
  )
}

