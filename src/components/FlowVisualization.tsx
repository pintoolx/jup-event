import { GitBranch, Wallet, Cpu, Flag, Send } from 'lucide-react'

interface FlowVisualizationProps {
  txStatus: string
}

export function FlowVisualization({ txStatus }: FlowVisualizationProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jup-green/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-jup-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Transaction Flow</h2>
            <p className="text-gray-500 text-xs">Complete execution pipeline</p>
          </div>
        </div>
        <div className="status-badge bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Ready
        </div>
      </div>

      {/* SVG Flow Diagram */}
      <div className="relative w-full" style={{ height: '580px' }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 580"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connection Lines */}
          {/* Wallet to Engine */}
          <path
            key="line-wallet-engine"
            className="connecting-line"
            d="M 200 60 L 200 105"
            stroke="#C7F284"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          {/* Engine to Jupiter */}
          <path
            key="line-engine-jupiter"
            className="connecting-line"
            d="M 200 190 L 100 240"
            stroke="#C7F284"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            style={{ animationDelay: '-0.3s' }}
          />
          {/* Engine to Drift */}
          <path
            key="line-engine-drift"
            className="connecting-line"
            d="M 200 190 L 300 240"
            stroke="#C7F284"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            style={{ animationDelay: '-0.6s' }}
          />
          {/* Jupiter to Event Wallet */}
          <path
            key="line-jupiter-event"
            className="connecting-line"
            d="M 100 310 L 200 360"
            stroke="#C7F284"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          {/* Drift to Event Wallet */}
          <path
            key="line-drift-event"
            className="connecting-line"
            d="M 300 310 L 200 360"
            stroke="#C7F284"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          {/* Event Wallet to Telegram */}
          <path
            key="line-event-telegram"
            className="connecting-line"
            d="M 200 440 L 200 490"
            stroke="#22D3EE"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            style={{ animationDelay: '-0.9s' }}
          />
        </svg>

        {/* User Wallet */}
        <div className="visual-node absolute top-0 left-1/2 -translate-x-1/2 w-28 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center mb-1.5 shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-300">Your Wallet</span>
          <span className="block text-[9px] text-gray-500 font-mono">USDC Balance</span>
        </div>

        {/* Hedging Engine (Center) */}
        <div className="visual-node absolute top-[105px] left-1/2 -translate-x-1/2 w-36">
          <div className="animate-pulse-glow bg-gradient-to-br from-[#1a2332] to-[#0f172a] rounded-xl p-3 border border-jup-green/30 text-center shadow-xl">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-jup-green to-jup-green-dark flex items-center justify-center mb-1.5">
              <Cpu className="w-5 h-5 text-jup-dark" />
            </div>
            <span className="text-xs font-bold text-white block">Hedging Engine</span>
            <span className="text-[9px] text-jup-green font-mono">Jito Bundle</span>
          </div>
        </div>

        {/* Jupiter Swap (Left) */}
        <div className="visual-node absolute top-[240px] left-[8%] w-28 text-center">
          <div className="w-11 h-11 mx-auto rounded-xl bg-black border border-gray-700 flex items-center justify-center mb-1.5 shadow-lg overflow-hidden">
            <img src="/jupiter.svg" alt="Jupiter" className="w-8 h-8" />
          </div>
          <span className="text-xs font-medium text-gray-300">Jupiter Swap</span>
          <span className="block text-[9px] text-yellow-400 font-mono">USDC → JUP</span>
        </div>

        {/* Drift Protocol (Right) */}
        <div className="visual-node absolute top-[240px] right-[8%] w-28 text-center">
          <div className="w-11 h-11 mx-auto rounded-xl bg-black border border-gray-700 flex items-center justify-center mb-1.5 shadow-lg overflow-hidden">
            <img src="/drift.svg" alt="Drift" className="w-8 h-8" />
          </div>
          <span className="text-xs font-medium text-gray-300">Drift Protocol</span>
          <span className="block text-[9px] text-purple-400 font-mono">1x Short JUP-PERP</span>
        </div>

        {/* Event Wallet */}
        <div className="visual-node absolute top-[360px] left-1/2 -translate-x-1/2 w-32 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-jup-green to-jup-green-dark border border-jup-green/50 flex items-center justify-center mb-1.5 shadow-lg shadow-jup-green/20">
            <Flag className="w-5 h-5 text-jup-dark" />
          </div>
          <span className="text-xs font-bold text-white">Event Wallet</span>
          <span className="block text-[9px] text-jup-green font-mono">Receive Hedged JUP</span>
        </div>

        {/* Telegram Notification */}
        <div className="visual-node absolute top-[490px] left-1/2 -translate-x-1/2 w-36 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 border border-cyan-400/50 flex items-center justify-center mb-1.5 shadow-lg shadow-cyan-500/20">
            <Send className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-bold text-white">Telegram Bot</span>
          <span className="block text-[9px] text-cyan-400 font-mono">Real-time Alert</span>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="mt-4">
        <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 text-xs">Transaction Status</span>
            <span className="font-mono text-jup-green text-xs">{txStatus}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

