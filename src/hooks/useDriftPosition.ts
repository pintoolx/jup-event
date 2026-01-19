import { useState, useEffect, useCallback, useRef } from 'react'
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { DriftClient, User } from '@drift-labs/sdk'
import { DriftPosition } from '../types'
import {
  BrowserWallet,
  initializeDriftClientWebSocket,
  getDriftUser,
  calculatePositionData,
  buildClosePositionTransaction,
  cleanupDriftClient,
  getPerpMarketIndex,
} from '../utils/drift'

// JUP-PERP market index
const JUP_PERP_MARKET_INDEX = getPerpMarketIndex('JUP-PERP')

interface UseDriftPositionProps {
  connection: Connection
  publicKey: PublicKey | null
  subAccountId: number | null
  signTransaction?: <T extends VersionedTransaction>(tx: T) => Promise<T>
  signAllTransactions?: <T extends VersionedTransaction>(txs: T[]) => Promise<T[]>
}

interface UseDriftPositionReturn {
  position: DriftPosition | null
  isLoading: boolean
  error: string | null
  closePosition: () => Promise<{ success: boolean; signature?: string; error?: string }>
  isClosing: boolean
  refresh: () => void
}

export function useDriftPosition({
  connection,
  publicKey,
  subAccountId,
  signTransaction,
  signAllTransactions,
}: UseDriftPositionProps): UseDriftPositionReturn {
  const [position, setPosition] = useState<DriftPosition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  // Refs to maintain client and user instances
  const driftClientRef = useRef<DriftClient | null>(null)
  const userRef = useRef<User | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize DriftClient and subscribe to user account
  const initializeAndSubscribe = useCallback(async () => {
    if (!publicKey || subAccountId === null || !signTransaction || !signAllTransactions) {
      return
    }

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create wallet adapter
      const wallet = new BrowserWallet(publicKey, signTransaction, signAllTransactions)

      // Initialize DriftClient with WebSocket
      const driftClient = await initializeDriftClientWebSocket(connection, wallet)
      driftClientRef.current = driftClient

      // Get User object for the subAccountId
      const user = await getDriftUser(driftClient, subAccountId)
      userRef.current = user

      isInitializedRef.current = true

      // Get initial position data
      await fetchPositionData()

      // Set up event listener for updates
      user.eventEmitter?.on('userAccountUpdate', () => {
        fetchPositionData()
      })

      console.log('Drift position subscription initialized for subAccountId:', subAccountId)
    } catch (err) {
      console.error('Failed to initialize Drift position subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to Drift')
    } finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, subAccountId, signTransaction, signAllTransactions])

  // Fetch position data from user account
  const fetchPositionData = useCallback(async () => {
    const user = userRef.current
    const driftClient = driftClientRef.current

    if (!user || !driftClient) {
      return
    }

    try {
      const positions = user.getActivePerpPositions()

      // Find JUP-PERP position
      const jupPosition = positions.find((p) => p.marketIndex === JUP_PERP_MARKET_INDEX)

      if (jupPosition) {
        const positionData = calculatePositionData(jupPosition, user, driftClient)
        setPosition(positionData)
      } else {
        setPosition(null)
      }
    } catch (err) {
      console.error('Error fetching position data:', err)
    }
  }, [])

  // Close position function
  const closePosition = useCallback(async (): Promise<{
    success: boolean
    signature?: string
    error?: string
  }> => {
    if (!publicKey || !driftClientRef.current || !position || !signTransaction) {
      return { success: false, error: 'Not connected or no position' }
    }

    setIsClosing(true)
    setError(null)

    try {
      // Build close position transaction
      const transaction = await buildClosePositionTransaction(
        connection,
        publicKey,
        driftClientRef.current,
        position.marketIndex,
        subAccountId ?? 0
      )

      // Sign transaction
      const signedTx = await signTransaction(transaction)

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      console.log('Position closed successfully:', signature)

      // Clear position state
      setPosition(null)

      return { success: true, signature }
    } catch (err) {
      console.error('Failed to close position:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to close position'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsClosing(false)
    }
  }, [connection, publicKey, position, subAccountId, signTransaction])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPositionData()
  }, [fetchPositionData])

  // Initialize on mount when required params are available
  useEffect(() => {
    if (publicKey && subAccountId !== null && signTransaction && signAllTransactions) {
      initializeAndSubscribe()
    }

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        if (userRef.current) {
          try {
            await userRef.current.unsubscribe()
          } catch (e) {
            console.warn('Error unsubscribing user:', e)
          }
          userRef.current = null
        }
        if (driftClientRef.current) {
          try {
            await cleanupDriftClient(driftClientRef.current)
          } catch (e) {
            console.warn('Error cleaning up DriftClient:', e)
          }
          driftClientRef.current = null
        }
        isInitializedRef.current = false
      }
      cleanup()
    }
  }, [publicKey, subAccountId, signTransaction, signAllTransactions, initializeAndSubscribe])

  // Reset when publicKey or subAccountId changes
  useEffect(() => {
    if (!publicKey || subAccountId === null) {
      setPosition(null)
      isInitializedRef.current = false
    }
  }, [publicKey, subAccountId])

  return {
    position,
    isLoading,
    error,
    closePosition,
    isClosing,
    refresh,
  }
}
