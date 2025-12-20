import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets, type ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana'
import {
  Connection,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js'
import { useSupabaseSync } from './useSupabaseSync'
import { useAtomicSwapShort, DriftShortResult } from './useAtomicSwapShort'
import { AtomicOperationConfig, SwapInputToken } from '../types'

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentWallet, setCurrentWallet] = useState<ConnectedStandardSolanaWallet | null>(null)
  const [providerLoading, setProviderLoading] = useState(false)

  // Token selection modal state
  const [showTokenModal, setShowTokenModal] = useState(false)

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

  // Execute with selected token (called after modal selection)
  const executeWithToken = useCallback(async (inputToken: SwapInputToken) => {
    // Close modal
    setShowTokenModal(false)

    // Get config with selected input token
    const config = getAtomicSwapConfig(inputToken)

    // Validate configuration
    if (!config.targetAddress) {
      alert('Target address not configured. Please set VITE_TARGET_ADDRESS in your environment.')
      return
    }

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

        // Show success alert
        setTimeout(() => {
          alert(
            `Atomic swap executed successfully!\n\n` +
            `Transactions completed:\n` +
            `- Jupiter Swap: ${signatures[0]?.slice(0, 12)}...\n` +
            `- Drift Short: ${signatures[1]?.slice(0, 12)}...\n` +
            `- Token Transfer: ${signatures[2]?.slice(0, 12)}...`
          )
        }, 500)
      } else {
        setError(result.error || 'Transaction failed')
        setStatus('error')
        alert(`Atomic swap failed\n\n${result.error}`)
      }

    } catch (err) {
      console.error('Transaction error:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setError('Cancelled by user')
        setStatus('idle')
        alert('Transaction cancelled\n\nUser cancelled the transaction.')
      } else {
        setError(errorMessage)
        setStatus('error')
        alert(`Error occurred\n\n${errorMessage}`)
      }
    }
  }, [walletAddress, saveDriftHistory, atomicSwap])

  // Open token selection modal (called when execute button is clicked)
  const execute = useCallback(async () => {
    if (!ready) {
      alert('Privy is loading, please wait...')
      return
    }

    if (!authenticated) {
      login()
      return
    }

    // If wallet not ready, use linkWallet to connect a Solana wallet
    if (!currentWallet) {
      if (providerLoading) {
        alert('Wallet is connecting. Please wait and try again...')
      } else {
        // User is already logged in, use linkWallet to connect a Solana wallet
        linkWallet()
      }
      return
    }

    // Show token selection modal
    setShowTokenModal(true)
  }, [ready, authenticated, login, linkWallet, currentWallet, providerLoading])

  // Close token modal
  const closeTokenModal = useCallback(() => {
    setShowTokenModal(false)
  }, [])

  return {
    walletAddress,
    status,
    isLoading: ['connecting', 'building', 'signing'].includes(status) || atomicSwap.isExecuting || providerLoading,
    isSuccess: status === 'success',
    buttonText: getButtonText(),
    txStatus: getTxStatus(),
    execute,
    // Token modal state and handlers
    showTokenModal,
    closeTokenModal,
    executeWithToken,
  }
}
