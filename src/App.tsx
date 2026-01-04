import {
  Header,
  HeroSection,
  StepsPanel,
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
    copyTransferTx,
    // Mode selection
    selectedMode,
    setSelectedMode,
    // Degen mode
    degenConfig,
    setDegenConfig,
    walletBalances,
    jupPrice,
    solPrice,
    // Drift position
    position,
    isPositionLoading,
    isClosingPosition,
    closePosition,
    refreshPosition,
  } = useWallet()

  return (
    <div className="bg-[#E4EAF2] text-[#0E0F28] flex flex-col font-sans selection:bg-[#2050F2]/30">
      {/* <BackgroundEffects /> */}

      <Header walletAddress={walletAddress} />

      <main className="relative z-10 flex items-center max-w-7xl min-h-[calc(100vh-80px-50px)] mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center w-full min-w-0">
          {/* Left Column - Hero & Info */}
          <HeroSection />

          {/* Right Column - Strategy Panel */}
          <StepsPanel
            isLoading={isLoading}
            isSuccess={isSuccess}
            isCompleted={isCompleted ?? false}
            buttonText={buttonText}
            onExecute={execute}
            onCopyTransferTx={copyTransferTx}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            degenConfig={degenConfig}
            onDegenConfigChange={setDegenConfig}
            walletBalances={walletBalances}
            jupPrice={jupPrice}
            solPrice={solPrice}
            position={position}
            isPositionLoading={isPositionLoading}
            isClosingPosition={isClosingPosition}
            onClosePosition={closePosition}
            onRefreshPosition={refreshPosition}
          />
        </div>
      </main>

      <Footer />

      {/* Token Selection Modal */}
      <TokenSelectionModal
        isOpen={showTokenModal}
        onClose={closeTokenModal}
        onSelect={(token) => executeWithToken(token, selectedMode)}
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
