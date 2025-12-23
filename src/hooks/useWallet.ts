import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets, type ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana'
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useSupabaseSync, CurrentStatus } from './useSupabaseSync'
import { useAtomicSwapShort, DriftShortResult } from './useAtomicSwapShort'
import { useToastContext } from '../contexts/ToastContext'
import { AtomicOperationConfig, SwapInputToken, TOKEN_ADDRESS } from '../types'
import {
  calculateRequiredSolForMinimumJup,
  calculateRequiredUsdcForMinimumJup,
  calculateRequiredDepositForShort,
} from '../utils/jupiter_swap'

// RPC URL from environment
const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://api.mainnet-beta.solana.com'

// Debug mode: use 10 JUP for testing, 250 JUP for production
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
const DEFAULT_JUP_AMOUNT = isDebugMode ? 10 : 250

// Atomic swap configuration (amounts auto-calculated based on debug mode and JUP price)
const getAtomicSwapConfig = (inputToken: SwapInputToken): AtomicOperationConfig => ({
  inputToken,
  solAmount: 0, // Auto-calculated in jupiter_swap.ts
  usdcAmount: 0, // Auto-calculated in jupiter_swap.ts
  shortAmount: DEFAULT_JUP_AMOUNT,
  transferAmount: DEFAULT_JUP_AMOUNT,
  targetAddress: import.meta.env.VITE_TARGET_ADDRESS || '',
  // depositAmount is now auto-calculated based on JUP price (1x leverage = 100% margin)
})

export type WalletStatus = 'idle' | 'connecting' | 'building' | 'signing' | 'success' | 'error'

export function useWallet() {
  const { ready, authenticated, login, linkWallet, user } = usePrivy()
  // Use useWallets from @privy-io/react-auth/solana for Solana-specific functionality
  const { wallets: solanaWallets } = useWallets()
  const { syncUser, saveDriftHistory, saveTransferTx, updateCurrentStatus } = useSupabaseSync()
  const toast = useToastContext()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentWallet, setCurrentWallet] = useState<ConnectedStandardSolanaWallet | null>(null)
  const [providerLoading, setProviderLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null)

  // Token selection modal state
  const [showTokenModal, setShowTokenModal] = useState(false)

  // Execution status modal state
  const [showExecutionModal, setShowExecutionModal] = useState(false)

  // Create connection instance
  const connection = useMemo(() => new Connection(RPC_URL, 'confirmed'), [])

  // Get public key from wallet address
  const publicKey = useMemo(() => {
    if (!walletAddress) return null
    try {
      return new PublicKey(walletAddress)
    } catch {
      return null
    }
  }, [walletAddress])

  // Create signing functions from current wallet
  // ConnectedStandardSolanaWallet uses the Solana Wallet Standard interface
  // which expects { transaction: Uint8Array } and returns { signedTransaction: Uint8Array }
  const signTransaction = useCallback(async <T extends VersionedTransaction>(tx: T): Promise<T> => {
    if (!currentWallet) throw new Error('No wallet connected')
    const serialized = tx.serialize()
    const result = await currentWallet.signTransaction({ transaction: serialized })
    return VersionedTransaction.deserialize(result.signedTransaction) as T
  }, [currentWallet])

  const signAllTransactions = useCallback(async <T extends VersionedTransaction>(txs: T[]): Promise<T[]> => {
    if (!currentWallet) throw new Error('No wallet connected')
    // Sign one by one using the Wallet Standard interface
    const signed: T[] = []
    for (const tx of txs) {
      const serialized = tx.serialize()
      const result = await currentWallet.signTransaction({ transaction: serialized })
      signed.push(VersionedTransaction.deserialize(result.signedTransaction) as T)
    }
    return signed
  }, [currentWallet])

  // Initialize atomic swap hook with Privy wallet signing functions
  const atomicSwap = useAtomicSwapShort({
    connection,
    publicKey,
    signTransaction: currentWallet ? signTransaction : undefined,
    signAllTransactions: currentWallet ? signAllTransactions : undefined,
  })

  // Get Solana wallet address and sync to Supabase
  useEffect(() => {
    console.log('useWallet effect:', { authenticated, solanaWalletsLength: solanaWallets.length, user })
    console.log('User linked accounts:', user?.linkedAccounts)
    console.log('Solana wallets from useWallets:', solanaWallets)

    if (authenticated && solanaWallets.length > 0) {
      setProviderLoading(true)

      // Get the first Solana wallet
      const wallet = solanaWallets[0]
      console.log('Using Solana wallet:', wallet)
      console.log('Wallet address:', wallet.address)
      console.log('Has signTransaction:', typeof wallet.signTransaction)

      setWalletAddress(wallet.address)
      setCurrentWallet(wallet)
      setProviderLoading(false)

      // Sync user to Supabase and get current_status
      syncUser(wallet.address).then((status) => {
        setCurrentStatus(status)
        if (status?.status === 'success') {
          console.log('User already completed execution')
        } else if (status?.status === 'failed') {
          console.log('User has failed execution at step', status.transaction, 'with ticker', status.ticker)
        }
      })

      console.log('Wallet setup complete!')
    } else if (authenticated) {
      console.log('Authenticated but no Solana wallets found yet')
      // Check user.linkedAccounts as fallback for address only
      const solanaAccounts = user?.linkedAccounts?.filter((account: any) =>
        account.type === 'wallet' && account.chainType === 'solana'
      )
      if (solanaAccounts && solanaAccounts.length > 0) {
        const account = solanaAccounts[0] as { address?: string }
        if (account.address) {
          console.log('Using Solana address from user.linkedAccounts:', account.address)
          setWalletAddress(account.address)
          syncUser(account.address).then((status) => {
            setCurrentStatus(status)
          })
        }
      }
    } else {
      setWalletAddress(null)
      setCurrentWallet(null)
      setCurrentStatus(null)
    }
  }, [authenticated, solanaWallets, user, syncUser])

  const getButtonText = useCallback(() => {
    // Check if already completed (permanent disable)
    if (currentStatus?.status === 'success') {
      return 'Already Completed'
    }

    // Check if resuming from failure
    if (currentStatus?.status === 'failed') {
      const ticker = currentStatus.ticker || 'SOL'
      const transaction = currentStatus.transaction || 1
      return `Resume from ${ticker} transaction ${transaction}`
    }

    // Use atomic swap progress if executing
    if (atomicSwap.isExecuting) {
      return atomicSwap.progress.message
    }

    // Show connecting when provider is loading
    if (providerLoading) {
      return 'Connecting Wallet...'
    }

    switch (status) {
      case 'connecting':
        return 'Connecting Wallet...'
      case 'building':
        return 'Building Transaction...'
      case 'signing':
        return 'Awaiting Signature...'
      case 'success':
        return 'Strategy Executed!'
      case 'error':
        return 'Retry'
      default:
        return 'One-Click Execute'
    }
  }, [status, providerLoading, atomicSwap.isExecuting, atomicSwap.progress.message, currentStatus])

  const getTxStatus = useCallback(() => {
    // Use atomic swap progress if executing
    if (atomicSwap.isExecuting) {
      const { step, currentTransaction, totalTransactions } = atomicSwap.progress
      return `Step ${currentTransaction || 1}/${totalTransactions || 3}: ${step}`
    }

    switch (status) {
      case 'connecting':
        return 'Connecting...'
      case 'building':
        return 'Building Bundle...'
      case 'signing':
        return 'Please sign in wallet...'
      case 'success':
        return txSignature
          ? `Success: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
          : 'Success!'
      case 'error':
        return error || 'Error occurred'
      default:
        return 'Awaiting Signature...'
    }
  }, [status, txSignature, error, atomicSwap.isExecuting, atomicSwap.progress])

  // Check balance before executing (dynamically calculate required amounts)
  const checkBalance = useCallback(async (inputToken: SwapInputToken): Promise<{
    hasEnough: boolean;
    balance: number;
    required: number;
    solBalance?: number;
    solRequired?: number;
    usdcBalance?: number;
    usdcRequired?: number;
    insufficientType?: 'sol' | 'usdc' | 'gas';
    details?: string;
  }> => {
    if (!publicKey) {
      return { hasEnough: false, balance: 0, required: 0 }
    }

    const config = getAtomicSwapConfig(inputToken)
    // Minimum SOL needed for gas fees (0.1 SOL to be safe for multiple transactions)
    const MIN_SOL_FOR_GAS = 0.01

    // Get SOL balance (needed for gas in all cases)
    const solBalance = await connection.getBalance(publicKey)
    const solBalanceNumber = solBalance / LAMPORTS_PER_SOL

    // Get USDC balance (only needed when USDC is used for deposit)
    const usdcMint = new PublicKey(TOKEN_ADDRESS.USDC)
    const ata = await getAssociatedTokenAddress(usdcMint, publicKey)
    let usdcBalance = 0
    try {
      const tokenAccount = await connection.getTokenAccountBalance(ata)
      usdcBalance = parseFloat(tokenAccount.value.uiAmountString || '0')
    } catch {
      // Token account doesn't exist, balance is 0
      usdcBalance = 0
    }

    if (inputToken === 'SOL') {
      // When using SOL: dynamically calculate swap + deposit + gas
      const { solAmount: requiredSolForSwap } = await calculateRequiredSolForMinimumJup()
      const { depositAmount: requiredSolForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'SOL')
      const totalRequiredSol = requiredSolForSwap + requiredSolForDeposit + MIN_SOL_FOR_GAS

      console.log(`Balance check (SOL): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (swap: ${requiredSolForSwap.toFixed(4)}, deposit: ${requiredSolForDeposit.toFixed(4)}, gas: ${MIN_SOL_FOR_GAS})`)

      // Check SOL
      if (solBalanceNumber < totalRequiredSol) {
        return {
          hasEnough: false,
          balance: solBalanceNumber,
          required: totalRequiredSol,
          insufficientType: 'sol',
          details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Deposit: ${requiredSolForDeposit.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL`,
        }
      }

      return {
        hasEnough: true,
        balance: solBalanceNumber,
        required: totalRequiredSol,
        details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Deposit: ${requiredSolForDeposit.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL`,
      }
    } else {
      // When using USDC: use USDC for swap and deposit collateral, SOL only for gas
      const { usdcAmount: requiredUsdcForSwap } = await calculateRequiredUsdcForMinimumJup()
      const { depositAmount: requiredUsdcForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'USDC')
      const totalRequiredUsdc = requiredUsdcForSwap + requiredUsdcForDeposit

      console.log(`Balance check (USDC): USDC balance=${usdcBalance.toFixed(2)}, required=${totalRequiredUsdc.toFixed(2)} (swap: ${requiredUsdcForSwap.toFixed(2)}, deposit: ${requiredUsdcForDeposit.toFixed(2)}), SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS}`)

      // Check SOL for gas first
      if (solBalanceNumber < MIN_SOL_FOR_GAS) {
        return {
          hasEnough: false,
          balance: solBalanceNumber,
          required: MIN_SOL_FOR_GAS,
          insufficientType: 'gas',
          details: 'Insufficient SOL for gas fees',
        }
      }

      // Check USDC
      if (usdcBalance < totalRequiredUsdc) {
        return {
          hasEnough: false,
          balance: usdcBalance,
          required: totalRequiredUsdc,
          insufficientType: 'usdc',
          details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC + Deposit: ${requiredUsdcForDeposit.toFixed(2)} USDC`,
        }
      }

      return {
        hasEnough: true,
        balance: usdcBalance,
        required: totalRequiredUsdc,
        solBalance: solBalanceNumber,
        solRequired: MIN_SOL_FOR_GAS,
        details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC + Deposit: ${requiredUsdcForDeposit.toFixed(2)} USDC`,
      }
    }
  }, [publicKey, connection])

  // Execute with selected token (called after modal selection)
  const executeWithToken = useCallback(async (inputToken: SwapInputToken) => {
    // Close token modal
    setShowTokenModal(false)

    // Get config with selected input token
    const config = getAtomicSwapConfig(inputToken)

    // Validate configuration
    if (!config.targetAddress) {
      toast.error('Configuration Error', 'Target address not configured.')
      return
    }

    // Determine starting step based on currentStatus
    let startFromStep = 0 // Default: start from beginning

    if (currentStatus?.status === 'failed' && currentStatus.ticker === inputToken) {
      // Resume from failed step (convert 1-4 to 0-3 index)
      startFromStep = (currentStatus.transaction || 1) - 1
      console.log(`Resuming from step ${startFromStep + 1} (${['Swap', 'Deposit', 'Short', 'Transfer'][startFromStep]})`)
    } else if (currentStatus?.status === 'failed' && currentStatus.ticker !== inputToken) {
      // Different token selected, must start from beginning
      startFromStep = 0
      console.log('Different token selected, starting from beginning')
    }

    // Check balance before proceeding
    try {
      const balanceCheck = await checkBalance(inputToken)
      if (!balanceCheck.hasEnough) {
        switch (balanceCheck.insufficientType) {
          case 'sol':
            toast.error(
              'Insufficient SOL Balance',
              `Need ${balanceCheck.required.toFixed(4)} SOL (${balanceCheck.details}). Current: ${balanceCheck.balance.toFixed(4)} SOL`
            )
            break
          case 'usdc':
            toast.error(
              'Insufficient USDC Balance',
              `Need ${balanceCheck.required.toFixed(2)} USDC (${balanceCheck.details}). Current: ${balanceCheck.balance.toFixed(2)} USDC`
            )
            break
          case 'gas':
            toast.error(
              'Insufficient SOL for Gas',
              `Need at least ${balanceCheck.required.toFixed(4)} SOL for transaction fees. Current: ${balanceCheck.balance.toFixed(4)} SOL`
            )
            break
          default:
            toast.error(
              'Insufficient Balance',
              `${balanceCheck.details || 'Please check your balance and try again.'}`
            )
        }
        return
      }
    } catch (err) {
      console.error('Balance check error:', err)
      toast.error('Balance Check Failed', 'Could not verify your balance. Please try again.')
      return
    }

    // Open execution modal after balance check passes
    setShowExecutionModal(true)

    try {
      setError(null)
      setStatus('building')

      // Create callback for saving Drift history
      const onDriftShortComplete = async (result: DriftShortResult) => {
        if (walletAddress) {
          await saveDriftHistory(walletAddress, result)
        }
      }

      // Create callback for saving Transfer TX
      const onTransferComplete = async (transferTx: string) => {
        if (walletAddress) {
          await saveTransferTx(walletAddress, transferTx)
        }
      }

      // Execute atomic swap with selected token and startFromStep
      const result = await atomicSwap.execute(config, onDriftShortComplete, onTransferComplete, startFromStep)

      if (result.success) {
        // Update current_status to success
        if (walletAddress) {
          await updateCurrentStatus(walletAddress, { status: 'success' })
          setCurrentStatus({ status: 'success' })
        }

        const signatures = result.transactions
          .filter(t => t.signature)
          .map(t => t.signature!)

        setTxSignature(signatures[signatures.length - 1] || null)
        setStatus('success')
        // Modal will show success state automatically
      } else {
        // Update current_status to failed
        const failedStep = (result.failedAtIndex ?? 0) + 1 // Convert 0-based to 1-based
        if (walletAddress) {
          const failedStatus: CurrentStatus = {
            status: 'failed',
            ticker: inputToken,
            transaction: failedStep as 1 | 2 | 3 | 4
          }
          await updateCurrentStatus(walletAddress, failedStatus)
          setCurrentStatus(failedStatus)
        }

        setError(result.error || 'Transaction failed')
        setStatus('error')
        // Modal will show error state automatically
      }

    } catch (err) {
      console.error('Transaction error:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Update current_status to failed on unexpected errors
      if (walletAddress) {
        const failedStatus: CurrentStatus = {
          status: 'failed',
          ticker: inputToken,
          transaction: 1 // Assume failed at first step for unexpected errors
        }
        await updateCurrentStatus(walletAddress, failedStatus)
        setCurrentStatus(failedStatus)
      }

      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setError('Cancelled by user')
        setStatus('error')
        // Modal will show error state - user can close it
      } else {
        setError(errorMessage)
        setStatus('error')
        // Modal will show error state
      }
    }
  }, [walletAddress, saveDriftHistory, saveTransferTx, updateCurrentStatus, atomicSwap, checkBalance, currentStatus, toast])

  // Open token selection modal (called when execute button is clicked)
  const execute = useCallback(async () => {
    if (!ready) {
      toast.info('Loading', 'Privy is loading, please wait...')
      return
    }

    // Check if user already completed (permanent disable)
    if (currentStatus?.status === 'success') {
      toast.info('Already Completed', 'You have already completed the execution.')
      return
    }

    if (!authenticated) {
      login()
      return
    }

    // If wallet not ready, use linkWallet to connect a Solana wallet
    if (!currentWallet) {
      if (providerLoading) {
        toast.info('Connecting', 'Wallet is connecting. Please wait and try again...')
      } else {
        // User is already logged in, use linkWallet to connect a Solana wallet
        linkWallet()
      }
      return
    }

    // If resuming from failure, skip token modal and execute directly
    if (currentStatus?.status === 'failed' && currentStatus.ticker) {
      executeWithToken(currentStatus.ticker)
      return
    }

    // Show token selection modal
    setShowTokenModal(true)
  }, [ready, authenticated, login, linkWallet, currentWallet, providerLoading, currentStatus, toast, executeWithToken])

  // Close token modal
  const closeTokenModal = useCallback(() => {
    setShowTokenModal(false)
  }, [])

  // Close execution modal and reset state
  const closeExecutionModal = useCallback(() => {
    setShowExecutionModal(false)
    // Reset to idle after closing
    if (status === 'success' || status === 'error') {
      setStatus('idle')
      setError(null)
      atomicSwap.reset()
    }
  }, [status, atomicSwap])

  return {
    walletAddress,
    status,
    error,
    isLoading: ['connecting', 'building', 'signing'].includes(status) || atomicSwap.isExecuting || providerLoading,
    isSuccess: status === 'success',
    isCompleted: currentStatus?.status === 'success',
    currentStatus,
    buttonText: getButtonText(),
    txStatus: getTxStatus(),
    execute,
    // Token modal state and handlers
    showTokenModal,
    closeTokenModal,
    executeWithToken,
    // Execution status modal state and handlers
    showExecutionModal,
    closeExecutionModal,
    executionProgress: atomicSwap.progress,
  }
}
