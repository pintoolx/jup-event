import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DriftShortResult } from './useAtomicSwapShort'

interface UseSupabaseSyncReturn {
    syncUser: (walletAddress: string) => Promise<void>
    saveDriftHistory: (walletAddress: string, driftResult: DriftShortResult) => Promise<void>
    saveTransferTx: (walletAddress: string, transferTx: string) => Promise<void>
    isLoading: boolean
    error: string | null
}

export function useSupabaseSync(): UseSupabaseSyncReturn {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const syncUser = useCallback(async (walletAddress: string) => {
        if (!supabase) {
            console.warn('Supabase not configured, skipping user sync')
            return
        }

        if (!walletAddress) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Call Edge Function to verify wallet and sync user
            // The Edge Function uses service_role key to bypass RLS securely
            const { data, error: invokeError } = await supabase.functions.invoke('verify-wallet', {
                body: {
                    wallet_address: walletAddress,
                    sync_user: true  // Request the Edge Function to also sync the user
                },
            })

            if (invokeError) {
                console.error('Wallet verification failed:', invokeError)
                setError(invokeError.message)
                return
            }

            if (!data?.valid) {
                console.error('Invalid wallet address:', data?.error)
                setError(data?.error || 'Invalid wallet address')
                return
            }

            if (data?.synced) {
                console.log('User synced to Supabase:', walletAddress)
            } else if (data?.error) {
                console.error('User sync failed:', data.error)
                setError(data.error)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            console.error('Supabase sync error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const saveDriftHistory = useCallback(async (walletAddress: string, driftResult: DriftShortResult) => {
        if (!supabase) {
            console.warn('Supabase not configured, skipping drift history save')
            return
        }

        if (!walletAddress) {
            console.error('No wallet address provided for drift history save')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Call Edge Function to save drift history
            // The Edge Function uses service_role key to bypass RLS securely
            const { data, error: invokeError } = await supabase.functions.invoke('save-drift-history', {
                body: {
                    wallet_address: walletAddress,
                    drift_result: driftResult
                },
            })

            if (invokeError) {
                console.error('Failed to save drift history:', invokeError)
                setError(invokeError.message)
                return
            }

            if (!data?.success) {
                console.error('Failed to save drift history:', data?.error)
                setError(data?.error || 'Failed to save drift history')
                return
            }

            console.log('Drift history saved for user:', walletAddress, driftResult)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            console.error('Drift history save error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const saveTransferTx = useCallback(async (walletAddress: string, transferTx: string) => {
        if (!supabase) {
            console.warn('Supabase not configured, skipping transfer tx save')
            return
        }

        if (!walletAddress) {
            console.error('No wallet address provided for transfer tx save')
            return
        }

        if (!transferTx) {
            console.error('No transfer tx provided')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Call Edge Function to save transfer tx
            // The Edge Function uses service_role key to bypass RLS securely
            const { data, error: invokeError } = await supabase.functions.invoke('save-transfer-tx', {
                body: {
                    wallet_address: walletAddress,
                    transfer_tx: transferTx
                },
            })

            if (invokeError) {
                console.error('Failed to save transfer tx:', invokeError)
                setError(invokeError.message)
                return
            }

            if (!data?.success) {
                console.error('Failed to save transfer tx:', data?.error)
                setError(data?.error || 'Failed to save transfer tx')
                return
            }

            console.log('Transfer tx saved for user:', walletAddress, transferTx)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            console.error('Transfer tx save error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        syncUser,
        saveDriftHistory,
        saveTransferTx,
        isLoading,
        error,
    }
}

