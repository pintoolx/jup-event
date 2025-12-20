import { Send, ExternalLink, XCircle, Loader2 } from 'lucide-react'
import { AtomicOperationProgress } from '../hooks/useAtomicSwapShort'

interface ExecutionStatusModalProps {
  isOpen: boolean
  progress: AtomicOperationProgress
  error?: string | null
  onClose: () => void
}

// Get step display text
function getStepText(step: string): string {
  switch (step) {
    case 'initializing':
      return 'Initializing Drift client...'
    case 'executing_swap':
      return 'Swapping to JUP tokens...'
    case 'executing_short':
      return 'Opening short position on Drift...'
    case 'executing_transfer':
      return 'Transferring JUP tokens...'
    case 'success':
      return 'All operations completed!'
    case 'error':
      return 'Transaction failed'
    default:
      return 'Preparing...'
  }
}

export function ExecutionStatusModal({
  isOpen,
  progress,
  error,
  onClose,
}: ExecutionStatusModalProps) {
  if (!isOpen) return null

  const isSuccess = progress.step === 'success'
  const isError = progress.step === 'error'
  const canClose = isSuccess || isError


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - only clickable when can close */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-8 w-full max-w-sm mx-4 animate-fade-in">
        {/* Center Icon / Spinner */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <a
              href="https://t.me/PinTool_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
            >
              <div className="w-24 h-24 rounded-2xl bg-[#0088cc] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
                <Send className="w-12 h-12 text-white" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-[#0088cc] transition-colors flex items-center gap-1">
                Open Telegram Bot
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ) : isError ? (
            <div className="w-24 h-24 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-jup-green/10 border border-jup-green/30 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-jup-green animate-spin" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <p className={`text-lg font-medium ${
            isSuccess ? 'text-emerald-400' :
            isError ? 'text-red-400' :
            'text-jup-green'
          }`}>
            {getStepText(progress.step)}
          </p>
          {isError && error && (
            <p className="text-sm text-gray-400 mt-2 break-words max-h-20 overflow-y-auto px-2">
              {error.length > 100 ? `${error.slice(0, 100)}...` : error}
            </p>
          )}
          {!isSuccess && !isError && progress.message && (
            <p className="text-sm text-gray-500 mt-1">{progress.message}</p>
          )}
        </div>

        {/* Transaction Signatures - show on both success and error */}
        {progress.transactionSignatures && progress.transactionSignatures.length > 0 && (
          <div className={`mb-6 p-3 rounded-xl border ${
            isError 
              ? 'bg-red-900/20 border-red-800/50' 
              : 'bg-gray-900/50 border-gray-800'
          }`}>
            <div className="text-xs text-gray-500 mb-2">
              {isError ? 'Completed Transactions (before failure)' : 
               progress.transactionSignatures.length > 1 ? 'All Transactions' : 'Transaction Signature'}
            </div>
            <div className="space-y-1">
              {progress.transactionSignatures.map((sig, idx) => (
                <a
                  key={sig}
                  href={`https://solscan.io/tx/${sig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                    isError 
                      ? 'text-gray-400 hover:text-red-400' 
                      : 'text-gray-400 hover:text-jup-green'
                  }`}
                >
                  {progress.transactionSignatures!.length > 1 && (
                    <span className="text-gray-600">{idx + 1}.</span>
                  )}
                  <span>{sig.slice(0, 16)}...{sig.slice(-6)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        {canClose && (
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
              isSuccess
                ? 'bg-jup-green text-jup-dark hover:opacity-90'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {isSuccess ? 'Done' : 'Close'}
          </button>
        )}

        {/* Cannot close message */}
        {!canClose && (
          <div className="text-center text-xs text-gray-500 mt-2">
            Please wait for the transaction to complete...
          </div>
        )}
      </div>
    </div>
  )
}
