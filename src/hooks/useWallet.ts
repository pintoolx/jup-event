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
import { useDriftPosition } from './useDriftPosition'
import { useToastContext } from '../contexts/ToastContext'
import { AtomicOperationConfig, SwapInputToken, TOKEN_ADDRESS, ExecutionMode, DegenConfig } from '../types'
import {
  calculateRequiredSolForMinimumJup,
  calculateRequiredUsdcForMinimumJup,
  calculateRequiredDepositForShort,
  getJupiterPrices,
} from '../utils/jupiter_swap'
import { useWalletBalance, WalletBalances, calculatePositionSizeJup, TOTAL_SOL_RESERVE } from './useWalletBalance'

// RPC URL from environment
const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://api.mainnet-beta.solana.com'

// Debug mode: use 10 JUP for testing, 250 JUP for production
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
const DEFAULT_JUP_AMOUNT = isDebugMode ? 10 : 250

// Atomic swap configuration (amounts auto-calculated based on debug mode and JUP price)
const getAtomicSwapConfig = (
  inputToken: SwapInputToken,
  mode: ExecutionMode,
  degenConfig?: DegenConfig,
  jupPrice?: number,
  solPrice?: number
): AtomicOperationConfig => {
  // For degen mode with config, calculate position size dynamically
  let positionSizeJup = DEFAULT_JUP_AMOUNT

  if (mode === 'degen' && degenConfig && jupPrice && jupPrice > 0) {
    const calculatedSize = calculatePositionSizeJup(
      degenConfig.collateralAmount,
      degenConfig.collateralToken,
      degenConfig.leverage,
      jupPrice,
      solPrice || 0
    )
    // Only use calculated size if it's valid (> 0)
    if (calculatedSize > 0) {
      positionSizeJup = calculatedSize
    }
  }

  return {
    inputToken,
    mode,
    solAmount: 0, // Auto-calculated in jupiter_swap.ts
    usdcAmount: 0, // Auto-calculated in jupiter_swap.ts
    shortAmount: positionSizeJup,
    transferAmount: DEFAULT_JUP_AMOUNT,
    targetAddress: import.meta.env.VITE_TARGET_ADDRESS || '',
    // depositAmount is now auto-calculated based on JUP price (1x leverage = 100% margin)
    degenConfig: mode === 'degen' ? degenConfig : undefined,
  }
}

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
  const [transferTx, setTransferTx] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<ExecutionMode>('hedge')
  const [subAccountId, setSubAccountId] = useState<number | null>(null)

  // Degen mode configuration
  const [degenConfig, setDegenConfig] = useState<DegenConfig>({
    leverage: 1,
    direction: 'long',
    collateralAmount: 0,
    collateralToken: 'SOL',
  })

  // Token prices
  const [prices, setPrices] = useState<{ jupPrice: number; solPrice: number }>({
    jupPrice: 0,
    solPrice: 0,
  })

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

  // Use wallet balance hook for real-time balance updates
  const walletBalances = useWalletBalance(publicKey, connection)

  // Fetch token prices periodically
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const priceData = await getJupiterPrices()
        setPrices(priceData)
      } catch (err) {
        console.error('Failed to fetch prices:', err)
      }
    }

    // Fetch immediately
    fetchPrices()

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000)

    return () => clearInterval(interval)
  }, [])

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

  // Use drift position hook for real-time position data
  const driftPosition = useDriftPosition({
    connection,
    publicKey,
    subAccountId,
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

      // Sync user to Supabase and get current_status, transfer_tx, and subAccountId
      syncUser(wallet.address).then((result) => {
        if (result) {
          setCurrentStatus(result.currentStatus)
          setTransferTx(result.transferTx)
          setSubAccountId(result.subAccountId)
          if (result.currentStatus?.status === 'success') {
            console.log('User already completed execution, transfer_tx:', result.transferTx, 'subAccountId:', result.subAccountId)
          } else if (result.currentStatus?.status === 'failed') {
            console.log('User has failed execution at step', result.currentStatus.transaction, 'with ticker', result.currentStatus.ticker)
          }
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
          syncUser(account.address).then((result) => {
            if (result) {
              setCurrentStatus(result.currentStatus)
              setTransferTx(result.transferTx)
              setSubAccountId(result.subAccountId)
            }
          })
        }
      }
    } else {
      setWalletAddress(null)
      setCurrentWallet(null)
      setCurrentStatus(null)
      setTransferTx(null)
      setSubAccountId(null)
    }
  }, [authenticated, solanaWallets, user, syncUser])

  const getButtonText = useCallback(() => {
    // Check if already completed (permanent disable)
    if (currentStatus?.status === 'success') {
      return 'Already Completed'
    }

    // Check if resuming from failure
    if (currentStatus?.status === 'failed') {
      const transaction = currentStatus.transaction || 1
      const mode = currentStatus.mode || 'hedge'
      const modeLabel = mode === 'standard' ? 'Standard' : mode === 'hedge' ? 'Hedge' : 'Degen'
      return `Resume ${modeLabel} TX ${transaction}`
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

  // Copy transfer tx to clipboard
  const copyTransferTx = useCallback(async () => {
    if (!transferTx) {
      toast.error('Error', 'No transfer transaction found')
      return
    }
    try {
      await navigator.clipboard.writeText(transferTx)
      toast.success('Copied', 'Transfer TX Copied!')
    } catch (err) {
      toast.error('Error', 'Failed to copy to clipboard')
    }
  }, [transferTx, toast])

  // Check balance before executing (dynamically calculate required amounts)
  // startFromStep: skip checking for already completed steps during resume
  const checkBalance = useCallback(async (inputToken: SwapInputToken, mode: ExecutionMode, startFromStep: number = 0): Promise<{
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

    const config = getAtomicSwapConfig(inputToken, mode, degenConfig, prices.jupPrice, prices.solPrice)
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

    // Standard mode: only need swap + gas (no deposit)
    // Steps: 0=Swap, 1=Transfer
    if (mode === 'standard') {
      if (inputToken === 'SOL') {
        // If resuming from Step 1+, Swap already completed, only need gas
        if (startFromStep >= 1) {
          const totalRequiredSol = MIN_SOL_FOR_GAS
          console.log(`Balance check (Standard/SOL Resume): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (gas only, swap already completed)`)

          if (solBalanceNumber < totalRequiredSol) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: totalRequiredSol,
              insufficientType: 'gas',
              details: `Gas: ${MIN_SOL_FOR_GAS} SOL (swap already completed)`,
            }
          }

          return {
            hasEnough: true,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            details: `Gas: ${MIN_SOL_FOR_GAS} SOL (swap already completed)`,
          }
        }

        // Step 0: Full check - swap + gas
        const { solAmount: requiredSolForSwap } = await calculateRequiredSolForMinimumJup()
        const totalRequiredSol = requiredSolForSwap + MIN_SOL_FOR_GAS

        console.log(`Balance check (Standard/SOL): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (swap: ${requiredSolForSwap.toFixed(4)}, gas: ${MIN_SOL_FOR_GAS})`)

        if (solBalanceNumber < totalRequiredSol) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            insufficientType: 'sol',
            details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL`,
          }
        }

        return {
          hasEnough: true,
          balance: solBalanceNumber,
          required: totalRequiredSol,
          details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL`,
        }
      } else {
        // USDC for standard mode
        // If resuming from Step 1+, Swap already completed, only need gas
        if (startFromStep >= 1) {
          console.log(`Balance check (Standard/USDC Resume): SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS} (swap already completed)`)

          if (solBalanceNumber < MIN_SOL_FOR_GAS) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: MIN_SOL_FOR_GAS,
              insufficientType: 'gas',
              details: 'Gas only (swap already completed)',
            }
          }

          return {
            hasEnough: true,
            balance: usdcBalance,
            required: 0,
            solBalance: solBalanceNumber,
            solRequired: MIN_SOL_FOR_GAS,
            details: 'Gas only (swap already completed)',
          }
        }

        // Step 0: Full check - swap + gas
        const { usdcAmount: requiredUsdcForSwap } = await calculateRequiredUsdcForMinimumJup()

        console.log(`Balance check (Standard/USDC): USDC balance=${usdcBalance.toFixed(2)}, required=${requiredUsdcForSwap.toFixed(2)}, SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS}`)

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
        if (usdcBalance < requiredUsdcForSwap) {
          return {
            hasEnough: false,
            balance: usdcBalance,
            required: requiredUsdcForSwap,
            insufficientType: 'usdc',
            details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC`,
          }
        }

        return {
          hasEnough: true,
          balance: usdcBalance,
          required: requiredUsdcForSwap,
          solBalance: solBalanceNumber,
          solRequired: MIN_SOL_FOR_GAS,
          details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC`,
        }
      }
    }

    // Degen mode: use degenConfig.collateralAmount and TOTAL_SOL_RESERVE (includes Drift init)
    // Steps: 0=Swap, 1=Deposit, 2=Long, 3=Transfer
    if (mode === 'degen' && degenConfig) {
      const collateralAmount = degenConfig.collateralAmount
      const collateralToken = degenConfig.collateralToken
      const MIN_SOL_FOR_GAS_ONLY = 0.01

      if (collateralToken === 'SOL' || inputToken === 'SOL') {
        // Step 2+: Long/Transfer already, only need gas
        if (startFromStep >= 2) {
          const totalRequiredSol = MIN_SOL_FOR_GAS_ONLY
          console.log(`Balance check (degen/SOL Resume Step ${startFromStep}): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (gas only)`)

          if (solBalanceNumber < totalRequiredSol) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: totalRequiredSol,
              insufficientType: 'gas',
              details: `Gas: ${MIN_SOL_FOR_GAS_ONLY} SOL (swap & deposit already completed)`,
            }
          }

          return {
            hasEnough: true,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            details: `Gas: ${MIN_SOL_FOR_GAS_ONLY} SOL (swap & deposit already completed)`,
          }
        }

        // Step 1: Deposit step, need collateral + reserve (no swap)
        if (startFromStep >= 1) {
          const totalRequiredSol = collateralAmount + TOTAL_SOL_RESERVE
          console.log(`Balance check (degen/SOL Resume Step 1): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (collateral: ${collateralAmount.toFixed(4)}, reserve: ${TOTAL_SOL_RESERVE}, swap already completed)`)

          if (solBalanceNumber < totalRequiredSol) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: totalRequiredSol,
              insufficientType: 'sol',
              details: `Collateral: ${collateralAmount.toFixed(4)} SOL + Fees: ${TOTAL_SOL_RESERVE} SOL (swap already completed)`,
            }
          }

          return {
            hasEnough: true,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            details: `Collateral: ${collateralAmount.toFixed(4)} SOL + Fees: ${TOTAL_SOL_RESERVE} SOL (swap already completed)`,
          }
        }

        // Step 0: Full check - swap + collateral + TOTAL_SOL_RESERVE
        const { solAmount: requiredSolForSwap } = await calculateRequiredSolForMinimumJup()
        const totalRequiredSol = requiredSolForSwap + collateralAmount + TOTAL_SOL_RESERVE

        console.log(`Balance check (degen/SOL): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (swap: ${requiredSolForSwap.toFixed(4)}, collateral: ${collateralAmount.toFixed(4)}, reserve: ${TOTAL_SOL_RESERVE})`)

        if (solBalanceNumber < totalRequiredSol) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            insufficientType: 'sol',
            details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Collateral: ${collateralAmount.toFixed(4)} SOL + Fees: ${TOTAL_SOL_RESERVE} SOL`,
          }
        }

        return {
          hasEnough: true,
          balance: solBalanceNumber,
          required: totalRequiredSol,
          details: `Swap: ${requiredSolForSwap.toFixed(4)} SOL + Collateral: ${collateralAmount.toFixed(4)} SOL + Fees: ${TOTAL_SOL_RESERVE} SOL`,
        }
      } else {
        // USDC mode: swap + collateral from USDC, TOTAL_SOL_RESERVE from SOL
        // Step 2+: Long/Transfer already, only need gas
        if (startFromStep >= 2) {
          console.log(`Balance check (degen/USDC Resume Step ${startFromStep}): SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS_ONLY} (swap & deposit already completed)`)

          if (solBalanceNumber < MIN_SOL_FOR_GAS_ONLY) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: MIN_SOL_FOR_GAS_ONLY,
              insufficientType: 'gas',
              details: 'Gas only (swap & deposit already completed)',
            }
          }

          return {
            hasEnough: true,
            balance: usdcBalance,
            required: 0,
            solBalance: solBalanceNumber,
            solRequired: MIN_SOL_FOR_GAS_ONLY,
            details: 'Gas only (swap & deposit already completed)',
          }
        }

        // Step 1: Deposit step, need collateral + reserve (no swap)
        if (startFromStep >= 1) {
          console.log(`Balance check (degen/USDC Resume Step 1): USDC balance=${usdcBalance.toFixed(2)}, collateral=${collateralAmount.toFixed(2)}, SOL balance=${solBalanceNumber.toFixed(4)}, reserve=${TOTAL_SOL_RESERVE} (swap already completed)`)

          if (solBalanceNumber < TOTAL_SOL_RESERVE) {
            return {
              hasEnough: false,
              balance: solBalanceNumber,
              required: TOTAL_SOL_RESERVE,
              insufficientType: 'gas',
              details: `Insufficient SOL for fees. Need ${TOTAL_SOL_RESERVE} SOL`,
            }
          }

          if (usdcBalance < collateralAmount) {
            return {
              hasEnough: false,
              balance: usdcBalance,
              required: collateralAmount,
              insufficientType: 'usdc',
              details: `Collateral: ${collateralAmount.toFixed(2)} USDC (swap already completed)`,
            }
          }

          return {
            hasEnough: true,
            balance: usdcBalance,
            required: collateralAmount,
            solBalance: solBalanceNumber,
            solRequired: TOTAL_SOL_RESERVE,
            details: `Collateral: ${collateralAmount.toFixed(2)} USDC (swap already completed)`,
          }
        }

        // Step 0: Full check - swap + collateral from USDC
        const { usdcAmount: requiredUsdcForSwap } = await calculateRequiredUsdcForMinimumJup()
        const totalRequiredUsdc = requiredUsdcForSwap + collateralAmount

        console.log(`Balance check (degen/USDC): USDC balance=${usdcBalance.toFixed(2)}, required=${totalRequiredUsdc.toFixed(2)} (swap: ${requiredUsdcForSwap.toFixed(2)}, collateral: ${collateralAmount.toFixed(2)}), SOL balance=${solBalanceNumber.toFixed(4)}, reserve=${TOTAL_SOL_RESERVE}`)

        // Check SOL for gas + Drift init first
        if (solBalanceNumber < TOTAL_SOL_RESERVE) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: TOTAL_SOL_RESERVE,
            insufficientType: 'gas',
            details: `Insufficient SOL for fees. Need ${TOTAL_SOL_RESERVE} SOL`,
          }
        }

        // Check USDC
        if (usdcBalance < totalRequiredUsdc) {
          return {
            hasEnough: false,
            balance: usdcBalance,
            required: totalRequiredUsdc,
            insufficientType: 'usdc',
            details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC + Collateral: ${collateralAmount.toFixed(2)} USDC`,
          }
        }

        return {
          hasEnough: true,
          balance: usdcBalance,
          required: totalRequiredUsdc,
          solBalance: solBalanceNumber,
          solRequired: TOTAL_SOL_RESERVE,
          details: `Swap: ${requiredUsdcForSwap.toFixed(2)} USDC + Collateral: ${collateralAmount.toFixed(2)} USDC`,
        }
      }
    }

    // Hedge mode: need swap + deposit + gas
    // Steps: 0=Swap, 1=Deposit, 2=Short, 3=Transfer
    if (inputToken === 'SOL') {
      // Step 2+: Short/Transfer already, only need gas
      if (startFromStep >= 2) {
        const totalRequiredSol = MIN_SOL_FOR_GAS
        console.log(`Balance check (hedge/SOL Resume Step ${startFromStep}): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (gas only)`)

        if (solBalanceNumber < totalRequiredSol) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            insufficientType: 'gas',
            details: `Gas: ${MIN_SOL_FOR_GAS} SOL (swap & deposit already completed)`,
          }
        }

        return {
          hasEnough: true,
          balance: solBalanceNumber,
          required: totalRequiredSol,
          details: `Gas: ${MIN_SOL_FOR_GAS} SOL (swap & deposit already completed)`,
        }
      }

      // Step 1: Deposit step, need deposit + gas (no swap)
      if (startFromStep >= 1) {
        const { depositAmount: requiredSolForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'SOL')
        const totalRequiredSol = requiredSolForDeposit + MIN_SOL_FOR_GAS

        console.log(`Balance check (hedge/SOL Resume Step 1): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (deposit: ${requiredSolForDeposit.toFixed(4)}, gas: ${MIN_SOL_FOR_GAS}, swap already completed)`)

        if (solBalanceNumber < totalRequiredSol) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: totalRequiredSol,
            insufficientType: 'sol',
            details: `Deposit: ${requiredSolForDeposit.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL (swap already completed)`,
          }
        }

        return {
          hasEnough: true,
          balance: solBalanceNumber,
          required: totalRequiredSol,
          details: `Deposit: ${requiredSolForDeposit.toFixed(4)} SOL + Gas: ${MIN_SOL_FOR_GAS} SOL (swap already completed)`,
        }
      }

      // Step 0: Full check - swap + deposit + gas
      const { solAmount: requiredSolForSwap } = await calculateRequiredSolForMinimumJup()
      const { depositAmount: requiredSolForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'SOL')
      const totalRequiredSol = requiredSolForSwap + requiredSolForDeposit + MIN_SOL_FOR_GAS

      console.log(`Balance check (${mode}/SOL): SOL balance=${solBalanceNumber.toFixed(4)}, required=${totalRequiredSol.toFixed(4)} (swap: ${requiredSolForSwap.toFixed(4)}, deposit: ${requiredSolForDeposit.toFixed(4)}, gas: ${MIN_SOL_FOR_GAS})`)

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
      // Step 2+: Short/Transfer already, only need gas
      if (startFromStep >= 2) {
        console.log(`Balance check (hedge/USDC Resume Step ${startFromStep}): SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS} (swap & deposit already completed)`)

        if (solBalanceNumber < MIN_SOL_FOR_GAS) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: MIN_SOL_FOR_GAS,
            insufficientType: 'gas',
            details: 'Gas only (swap & deposit already completed)',
          }
        }

        return {
          hasEnough: true,
          balance: usdcBalance,
          required: 0,
          solBalance: solBalanceNumber,
          solRequired: MIN_SOL_FOR_GAS,
          details: 'Gas only (swap & deposit already completed)',
        }
      }

      // Step 1: Deposit step, need deposit + gas (no swap)
      if (startFromStep >= 1) {
        const { depositAmount: requiredUsdcForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'USDC')

        console.log(`Balance check (hedge/USDC Resume Step 1): USDC balance=${usdcBalance.toFixed(2)}, deposit=${requiredUsdcForDeposit.toFixed(2)}, SOL balance=${solBalanceNumber.toFixed(4)}, gas=${MIN_SOL_FOR_GAS} (swap already completed)`)

        if (solBalanceNumber < MIN_SOL_FOR_GAS) {
          return {
            hasEnough: false,
            balance: solBalanceNumber,
            required: MIN_SOL_FOR_GAS,
            insufficientType: 'gas',
            details: 'Insufficient SOL for gas fees',
          }
        }

        if (usdcBalance < requiredUsdcForDeposit) {
          return {
            hasEnough: false,
            balance: usdcBalance,
            required: requiredUsdcForDeposit,
            insufficientType: 'usdc',
            details: `Deposit: ${requiredUsdcForDeposit.toFixed(2)} USDC (swap already completed)`,
          }
        }

        return {
          hasEnough: true,
          balance: usdcBalance,
          required: requiredUsdcForDeposit,
          solBalance: solBalanceNumber,
          solRequired: MIN_SOL_FOR_GAS,
          details: `Deposit: ${requiredUsdcForDeposit.toFixed(2)} USDC (swap already completed)`,
        }
      }

      // Step 0: Full check - swap + deposit from USDC
      const { usdcAmount: requiredUsdcForSwap } = await calculateRequiredUsdcForMinimumJup()
      const { depositAmount: requiredUsdcForDeposit } = await calculateRequiredDepositForShort(config.shortAmount, 'USDC')
      const totalRequiredUsdc = requiredUsdcForSwap + requiredUsdcForDeposit

      console.log(`Balance check (${mode}/USDC): USDC balance=${usdcBalance.toFixed(2)}, required=${totalRequiredUsdc.toFixed(2)} (swap: ${requiredUsdcForSwap.toFixed(2)}, deposit: ${requiredUsdcForDeposit.toFixed(2)}), SOL balance=${solBalanceNumber.toFixed(4)}, gas required=${MIN_SOL_FOR_GAS}`)

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
  }, [publicKey, connection, degenConfig, prices])

  // Execute with selected token (called after modal selection)
  const executeWithToken = useCallback(async (inputToken: SwapInputToken, mode: ExecutionMode) => {
    // Close token modal
    setShowTokenModal(false)

    // Get config with selected input token, mode, degenConfig, and prices
    const config = getAtomicSwapConfig(inputToken, mode, degenConfig, prices.jupPrice, prices.solPrice)

    // Validate configuration
    if (!config.targetAddress) {
      toast.error('Configuration Error', 'Target address not configured.')
      return
    }

    // Determine starting step based on currentStatus
    let startFromStep = 0 // Default: start from beginning

    if (currentStatus?.status === 'failed' && currentStatus.ticker === inputToken && currentStatus.mode === mode) {
      // Resume from failed step (convert to 0-based index)
      // Validate transaction number against mode
      const maxTx = mode === 'standard' ? 2 : 4
      if (currentStatus.transaction && currentStatus.transaction <= maxTx) {
        startFromStep = (currentStatus.transaction || 1) - 1
        const stepNames = mode === 'standard'
          ? ['Swap', 'Transfer']
          : ['Swap', 'Deposit', mode === 'degen' ? 'Long' : 'Short', 'Transfer']
        console.log(`Resuming ${mode} mode from step ${startFromStep + 1} (${stepNames[startFromStep]})`)
      }
    } else if (currentStatus?.status === 'failed') {
      // Different token or mode selected, must start from beginning
      startFromStep = 0
      console.log('Different token/mode selected, starting from beginning')
    }

    // Check balance before proceeding (pass startFromStep to skip already completed steps)
    try {
      const balanceCheck = await checkBalance(inputToken, mode, startFromStep)
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
          // Update local state immediately after saving
          setTransferTx(transferTx)
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
        // Update current_status to failed with mode
        const failedStep = (result.failedAtIndex ?? 0) + 1 // Convert 0-based to 1-based
        const maxTransaction = mode === 'standard' ? 2 : 4
        if (walletAddress) {
          const failedStatus: CurrentStatus = {
            status: 'failed',
            ticker: inputToken,
            transaction: Math.min(failedStep, maxTransaction) as 1 | 2 | 3 | 4,
            mode: mode
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

      // Update current_status to failed on unexpected errors with mode
      // Use the current transaction from progress, or fallback to startFromStep + 1
      const maxTransaction = mode === 'standard' ? 2 : 4
      if (walletAddress) {
        const currentTransaction = atomicSwap.progress.currentTransaction || (startFromStep + 1)
        const failedStatus: CurrentStatus = {
          status: 'failed',
          ticker: inputToken,
          transaction: Math.min(currentTransaction, maxTransaction) as 1 | 2 | 3 | 4,
          mode: mode
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
  }, [walletAddress, saveDriftHistory, saveTransferTx, updateCurrentStatus, atomicSwap, checkBalance, currentStatus, toast, degenConfig, prices])

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

    // If resuming from failure, skip token modal and execute directly with stored mode
    if (currentStatus?.status === 'failed' && currentStatus.ticker && currentStatus.mode) {
      executeWithToken(currentStatus.ticker, currentStatus.mode)
      return
    }

    // For degen mode, use the collateralToken from degenConfig directly (no modal needed)
    if (selectedMode === 'degen') {
      executeWithToken(degenConfig.collateralToken, 'degen')
      return
    }

    // Show token selection modal for hedge and standard modes
    setShowTokenModal(true)
  }, [ready, authenticated, login, linkWallet, currentWallet, providerLoading, currentStatus, toast, executeWithToken, selectedMode, degenConfig.collateralToken])

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
    // Transfer TX for completed users
    transferTx,
    copyTransferTx,
    // Mode selection state
    selectedMode,
    setSelectedMode,
    // Degen mode state
    degenConfig,
    setDegenConfig,
    // Wallet balances for degen mode
    walletBalances: walletBalances as WalletBalances,
    // Token prices
    jupPrice: prices.jupPrice,
    solPrice: prices.solPrice,
    // Drift position state
    position: driftPosition.position,
    isPositionLoading: driftPosition.isLoading,
    isClosingPosition: driftPosition.isClosing,
    closePosition: driftPosition.closePosition,
    refreshPosition: driftPosition.refresh,
  }
}
