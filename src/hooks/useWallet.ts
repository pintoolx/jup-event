import { useState, useCallback, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import type { ConnectedWallet } from '@privy-io/react-auth'
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl
} from '@solana/web3.js'
import { useSupabaseSync } from './useSupabaseSync'

// Mock Event Receiver Address (System Program for demo)
const EVENT_WALLET = '11111111111111111111111111111111'
const MOCK_AMOUNT = 1000 // 0.000001 SOL in lamports

export type WalletStatus = 'idle' | 'connecting' | 'building' | 'signing' | 'success' | 'error'

// Type guard to check if wallet is a Solana wallet
function isSolanaWallet(wallet: ConnectedWallet): boolean {
  // Check multiple possible ways a wallet might indicate it's Solana
  const w = wallet as any
  return (
    w.chainType === 'solana' ||
    w.walletClientType === 'phantom' ||
    w.walletClientType === 'solflare' ||
    w.connectorType?.includes('solana') ||
    (wallet.address && wallet.address.length >= 32 && wallet.address.length <= 44 && !wallet.address.startsWith('0x'))
  )
}

// Get provider from wallet (with type assertion)
async function getSolanaProvider(wallet: ConnectedWallet) {
  // Privy wallets have getProvider method
  if ('getProvider' in wallet && typeof (wallet as { getProvider: () => Promise<unknown> }).getProvider === 'function') {
    return (wallet as { getProvider: () => Promise<{ signAndSendTransaction: (tx: Transaction) => Promise<string | { signature: string }> }> }).getProvider()
  }
  throw new Error('Wallet does not have getProvider method')
}

export function useWallet() {
  const { ready, authenticated, login, user } = usePrivy()
  const { wallets } = useWallets()
  const { syncUser } = useSupabaseSync()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get Solana wallet address and sync to Supabase
  useEffect(() => {
    console.log('useWallet effect:', { authenticated, walletsLength: wallets.length, user })
    console.log('User linked accounts:', user?.linkedAccounts)
    console.log('All wallets from useWallets:', wallets)

    if (authenticated) {
      // Check user.linkedAccounts for Solana wallets
      const solanaAccounts = user?.linkedAccounts?.filter((account: any) =>
        account.type === 'wallet' && account.chainType === 'solana'
      )
      console.log('Solana accounts from user:', solanaAccounts)

      if (wallets.length > 0) {
        // Log each wallet's properties
        wallets.forEach((wallet, index) => {
          const w = wallet as any
          const isSolana = isSolanaWallet(wallet)
          console.log(`Wallet ${index} (isSolana: ${isSolana}):`, {
            address: wallet.address,
            walletClientType: wallet.walletClientType,
            chainType: w.chainType,
            connectorType: w.connectorType,
            walletClient: w.walletClient,
            allKeys: Object.keys(wallet)
          })
        })

        // Find Solana wallet specifically
        const solanaWallet = wallets.find(wallet => isSolanaWallet(wallet))
        console.log('Found Solana wallet:', solanaWallet ? 'YES' : 'NO')
        console.log('Selected wallet:', solanaWallet)
        console.log('Selected wallet address:', solanaWallet?.address)

        if (solanaWallet?.address) {
          console.log('Setting wallet address:', solanaWallet.address)
          setWalletAddress(solanaWallet.address)
          // Sync user to Supabase (set catpurr = true)
          syncUser(solanaWallet.address)
        } else {
          console.log('No Solana wallet found in wallets array')
        }
      } else if (solanaAccounts && solanaAccounts.length > 0) {
        // Fallback to user.linkedAccounts
        const address = solanaAccounts[0].address
        console.log('Using Solana address from user.linkedAccounts:', address)
        setWalletAddress(address)
        syncUser(address)
      } else {
        console.log('No Solana wallet found anywhere')
        setWalletAddress(null)
      }
    } else {
      setWalletAddress(null)
    }
  }, [authenticated, wallets, user, syncUser])

  const getButtonText = useCallback(() => {
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
  }, [status])

  const getTxStatus = useCallback(() => {
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
  }, [status, txSignature, error])

  const execute = useCallback(async () => {
    if (!ready) {
      alert('Privy is loading, please wait...')
      return
    }

    if (!authenticated) {
      login()
      return
    }

    try {
      setError(null)
      setStatus('connecting')

      // Get Solana wallet
      const solanaWallet = wallets.find(wallet => isSolanaWallet(wallet))

      if (!solanaWallet) {
        alert('No Solana wallet found. Please connect a Solana wallet.')
        setStatus('idle')
        return
      }

      const publicKey = new PublicKey(solanaWallet.address)

      setStatus('building')

      // Create connection
      const connection = new Connection(
        clusterApiUrl('mainnet-beta'),
        'confirmed'
      )

      // Create mock transaction
      const transaction = new Transaction()

      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(EVENT_WALLET),
        lamports: MOCK_AMOUNT,
      })

      transaction.add(instruction)

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      setStatus('signing')

      // Sign and send with Privy wallet
      const provider = await getSolanaProvider(solanaWallet)
      const signedTx = await provider.signAndSendTransaction(transaction)

      const signature = typeof signedTx === 'string' ? signedTx : signedTx.signature

      setTxSignature(signature)
      setStatus('success')

      // Show success alert
      setTimeout(() => {
        alert(
          `✅ Simulated execution successful!\n\n` +
          `Transaction sent (this is just a test transaction)\n` +
          `Transaction: ${signature.slice(0, 20)}...\n\n` +
          `The actual version will include:\n` +
          `• Jupiter Swap (Buy JUP)\n` +
          `• Drift Short Position\n` +
          `• Transfer to Event Wallet`
        )
      }, 500)

    } catch (err) {
      console.error('Transaction error:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setError('Cancelled by user')
        setStatus('idle')
        alert('❌ Transaction cancelled\n\nUser cancelled the transaction.')
      } else {
        setError(errorMessage)
        setStatus('error')
        alert(`❌ Error occurred\n\n${errorMessage}`)
      }
    }
  }, [ready, authenticated, wallets, login])

  return {
    walletAddress,
    status,
    isLoading: ['connecting', 'building', 'signing'].includes(status),
    isSuccess: status === 'success',
    buttonText: getButtonText(),
    txStatus: getTxStatus(),
    execute,
  }
}
