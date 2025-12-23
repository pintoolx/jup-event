import {
  Header,
  HeroSection,
  StepsPanel,
  FlowVisualization,
  Footer,
  BackgroundEffects,
  TokenSelectionModal,
  ExecutionStatusModal,
  FloatingTelegramButton
} from './components'
import { useWallet } from './hooks/useWallet'

function App() {
  const {
    walletAddress,
    isLoading,
    isSuccess,
    isCompleted,
    buttonText,
    txStatus,
    execute,
    showTokenModal,
    closeTokenModal,
    executeWithToken,
    // Execution status modal
    showExecutionModal,
    closeExecutionModal,
    executionProgress,
    error,
    // Transfer TX for completed users
    copyTransferTx
  } = useWallet()

  return (
    <div className="text-white overflow-x-hidden min-h-screen">
      <BackgroundEffects />

      <Header walletAddress={walletAddress} />

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <HeroSection />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <StepsPanel
            isLoading={isLoading}
            isSuccess={isSuccess}
            isCompleted={isCompleted ?? false}
            buttonText={buttonText}
            onExecute={execute}
            onCopyTransferTx={copyTransferTx}
          />
          <FlowVisualization txStatus={txStatus} />
        </div>
      </main>

      <Footer />

      {/* Token Selection Modal */}
      <TokenSelectionModal
        isOpen={showTokenModal}
        onClose={closeTokenModal}
        onSelect={executeWithToken}
      />

      {/* Execution Status Modal */}
      <ExecutionStatusModal
        isOpen={showExecutionModal}
        progress={executionProgress}
        error={error}
        onClose={closeExecutionModal}
      />

      {/* Floating Telegram Button */}
      <FloatingTelegramButton />
    </div>
  )
}

export default App
