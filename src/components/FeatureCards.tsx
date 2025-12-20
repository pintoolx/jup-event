import { Shield, Zap, Clock } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Delta Neutral',
    description: "Your position is hedged. JUP price movements have minimal impact on your capital.",
    colorClass: 'yellow',
  },
  {
    icon: Zap,
    title: 'Atomic Execution',
    description: 'All 3 operations execute together atomically. No partial fills.',
    colorClass: 'purple',
  },
  {
    icon: Clock,
    title: 'One Signature',
    description: 'Just one wallet approval. No complex multi-step processes required.',
    colorClass: 'jup',
  },
]

const colorMap: Record<string, { bg: string; text: string }> = {
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  jup: { bg: 'bg-jup-green/10', text: 'text-jup-green' },
}

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {features.map((feature) => {
        const colors = colorMap[feature.colorClass]
        const Icon = feature.icon
        
        return (
          <div 
            key={feature.title}
            className="glass-panel rounded-2xl p-6"
          >
            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <h3 className="font-semibold mb-2 text-white">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        )
      })}
    </div>
  )
}

