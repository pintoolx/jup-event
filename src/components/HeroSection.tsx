import { ExternalLink } from 'lucide-react'

export function HeroSection() {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 bg-jup-green/10 text-jup-green px-4 py-2 rounded-full text-sm font-medium mb-6 border border-jup-green/20">
        <span className="w-2 h-2 bg-jup-green rounded-full" />
        Powered by PinTool
      </div>
      
      <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
        <span className="jup-gradient">Catpurr</span>
      </h1>
      
      <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
        Get ready to CatLumpurr together!
      </p>

      {/* Event Link */}
      <a
        href="https://luma.com/7f1gdren?tk=kQ8qKF"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-jup-green/10 hover:bg-jup-green/20 border-2 border-jup-green/50 hover:border-jup-green rounded-lg text-jup-green font-semibold transition-all"
      >
        <ExternalLink className="w-5 h-5" />
        View Jupiter Event: CATLUMPURR '26 - Kuala Lumpur, Malaysia
      </a>
    </div>
  )
}

