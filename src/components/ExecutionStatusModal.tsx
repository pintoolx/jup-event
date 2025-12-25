import { useState } from 'react'
import { Send, ExternalLink, XCircle, Loader2, CheckCircle, Copy, Check } from 'lucide-react'
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
  const [copiedSig, setCopiedSig] = useState<string | null>(null)

  if (!isOpen) return null

  const isSuccess = progress.step === 'success'
  const isError = progress.step === 'error'
  const canClose = isSuccess || isError

  // Get the transfer tx (last transaction - Token Transfer is always the last one)
  const transferTxSignature = progress.transactionSignatures?.length
    ? progress.transactionSignatures[progress.transactionSignatures.length - 1]
    : null

  const handleCopy = async (sig: string) => {
    await navigator.clipboard.writeText(sig)
    setCopiedSig(sig)
    setTimeout(() => setCopiedSig(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - only clickable when can close */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-4 animate-fade-in">
        {/* Center Icon / Spinner */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="w-24 h-24 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
          ) : isError ? (
            <div className="w-24 h-24 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          ) : (
                <div className="w-24 h-24 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <p className={`text-lg font-medium ${
            isSuccess ? 'text-emerald-400' :
            isError ? 'text-red-400' :
              'text-blue-400'
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

        {/* Transfer TX - Special highlight for registration form */}
        {isSuccess && transferTxSignature && (
          <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-400">Transfer Transaction</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">
              ⚠️ Copy this tx signature for the registration form
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-white bg-gray-900/50 px-2 py-1.5 rounded truncate">
                {transferTxSignature}
              </code>
              <button
                onClick={() => handleCopy(transferTxSignature)}
                className="flex-shrink-0 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                title="Copy to clipboard"
              >
                {copiedSig === transferTxSignature ? (
                  <Check className="w-4 h-4 text-blue-400" />
                ) : (
                    <Copy className="w-4 h-4 text-blue-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Transaction Signatures - show on both success and error */}
        {progress.transactionSignatures && progress.transactionSignatures.length > 0 && (
          <div className={`mb-6 p-3 rounded-xl border ${
            isError 
              ? 'bg-red-900/20 border-red-800/50' 
              : 'bg-gray-900/50 border-gray-800'
          }`}>
            <div className="text-xs text-gray-500 mb-2">
              {isError ? 'Completed Transactions (before failure)' : 'All Transactions'}
            </div>
            <div className="space-y-1">
              {progress.transactionSignatures.map((sig, idx) => (
                <div key={sig} className="flex items-center gap-2">
                  <a
                    href={`https://solscan.io/tx/${sig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center gap-2 text-xs font-mono transition-colors ${isError
                      ? 'text-gray-400 hover:text-red-400'
                      : 'text-gray-400 hover:text-blue-400'
                      }`}
                  >
                    <span className="text-gray-600">{idx + 1}.</span>
                    <span>{sig.slice(0, 12)}...{sig.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canClose && (
          <div className="space-y-2">
            {isSuccess && (
              <a
                href="https://t.me/PinTool_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl font-bold bg-[#0088cc] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Open PinTool Bot
              </a>
            )}
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${isSuccess
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
            >
              Close
            </button>
          </div>
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
