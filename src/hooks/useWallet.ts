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
import { useSupabaseSync } from './useSupabaseSync'
import { useAtomicSwapShort, DriftShortResult } from './useAtomicSwapShort'
import { useToastContext } from '../contexts/ToastContext'
import { AtomicOperationConfig, SwapInputToken, TOKEN_ADDRESS } from '../types'

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
  const { syncUser, saveDriftHistory } = useSupabaseSync()
  const toast = useToastContext()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentWallet, setCurrentWallet] = useState<ConnectedStandardSolanaWallet | null>(null)
  const [providerLoading, setProviderLoading] = useState(false)

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

      // Sync user to Supabase (set catpurr = true)
      syncUser(wallet.address)

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
          syncUser(account.address)
        }
      }
    } else {
      setWalletAddress(null)
      setCurrentWallet(null)
    }
  }, [authenticated, solanaWallets, user, syncUser])

  const getButtonText = useCallback(() => {
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
  }, [status, providerLoading, atomicSwap.isExecuting, atomicSwap.progress.message])

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

  // Check balance before executing
  const checkBalance = useCallback(async (inputToken: SwapInputToken): Promise<{ hasEnough: boolean; balance: number; required: number }> => {
    if (!publicKey) {
      return { hasEnough: false, balance: 0, required: 0 }
    }

    const config = getAtomicSwapConfig(inputToken)
    // Minimum SOL needed for gas fees (0.05 SOL should be enough for all transactions)
    const MIN_SOL_FOR_GAS = 0.05

    if (inputToken === 'SOL') {
      const solBalance = await connection.getBalance(publicKey)
      const solBalanceNumber = solBalance / LAMPORTS_PER_SOL
      const requiredSol = config.solAmount + MIN_SOL_FOR_GAS
      return {
        hasEnough: solBalanceNumber >= requiredSol,
        balance: solBalanceNumber,
        required: requiredSol,
      }
    } else {
      // Check USDC balance
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

      // Also check SOL for gas
      const solBalance = await connection.getBalance(publicKey)
      const solBalanceNumber = solBalance / LAMPORTS_PER_SOL

      if (solBalanceNumber < MIN_SOL_FOR_GAS) {
        return {
          hasEnough: false,
          balance: solBalanceNumber,
          required: MIN_SOL_FOR_GAS,
        }
      }

      return {
        hasEnough: usdcBalance >= config.usdcAmount,
        balance: usdcBalance,
        required: config.usdcAmount,
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

    // Check balance before proceeding
    try {
      const balanceCheck = await checkBalance(inputToken)
      if (!balanceCheck.hasEnough) {
        if (inputToken === 'SOL') {
          toast.error(
            'Insufficient SOL Balance',
            `You need at least ${balanceCheck.required.toFixed(4)} SOL. Current balance: ${balanceCheck.balance.toFixed(4)} SOL`
          )
        } else {
          // Check if it's SOL for gas or USDC issue
          const solBalance = await connection.getBalance(publicKey!)
          const solBalanceNumber = solBalance / LAMPORTS_PER_SOL
          if (solBalanceNumber < 0.05) {
            toast.error(
              'Insufficient SOL for Gas',
              `You need at least 0.05 SOL for transaction fees. Current: ${solBalanceNumber.toFixed(4)} SOL`
            )
          } else {
            toast.error(
              'Insufficient USDC Balance',
              `You need at least ${balanceCheck.required.toFixed(2)} USDC. Current balance: ${balanceCheck.balance.toFixed(2)} USDC`
            )
          }
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

      // Execute atomic swap with selected token
      const result = await atomicSwap.execute(config, onDriftShortComplete)

      if (result.success) {
        const signatures = result.transactions
          .filter(t => t.signature)
          .map(t => t.signature!)

        setTxSignature(signatures[signatures.length - 1] || null)
        setStatus('success')
        // Modal will show success state automatically
      } else {
        setError(result.error || 'Transaction failed')
        setStatus('error')
        // Modal will show error state automatically
      }

    } catch (err) {
      console.error('Transaction error:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

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
  }, [walletAddress, saveDriftHistory, atomicSwap, checkBalance, connection, publicKey, toast])

  // Open token selection modal (called when execute button is clicked)
  const execute = useCallback(async () => {
    if (!ready) {
      toast.info('Loading', 'Privy is loading, please wait...')
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

    // Show token selection modal
    setShowTokenModal(true)
  }, [ready, authenticated, login, linkWallet, currentWallet, providerLoading, toast])

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
