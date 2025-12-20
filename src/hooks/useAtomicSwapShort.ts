import { useState, useCallback } from 'react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { DriftClient } from '@drift-labs/sdk';
import { buildJupiterSwapTransaction, calculateRequiredDepositForShort } from '../utils/jupiter_swap';
import {
    BrowserWallet,
    initializeDriftClient,
    buildDriftShortTransaction,
    cleanupDriftClient,
} from '../utils/drift';
import { buildTokenTransferTransaction } from '../utils/transfer';
import {
    executeTransactionsSequentially,
    TransactionToBuild,
    SequentialExecutionResult,
    TransactionProgress,
} from '../utils/sequential-executor';
import { AtomicOperationConfig } from '../types';

export type AtomicOperationStep =
    | 'idle'
    | 'initializing'
    | 'executing_swap'
    | 'executing_short'
    | 'executing_transfer'
    | 'success'
    | 'error';

export interface AtomicOperationProgress {
    step: AtomicOperationStep;
    message: string;
    swapExpectedOutput?: number;
    currentTransaction?: number;
    totalTransactions?: number;
    transactionSignatures?: string[];
}

export interface DriftShortResult {
    marketName: string;
    shortAmount: number;
    depositAmount?: number;
    signature?: string;
    timestamp: string;
    status: 'success' | 'failed';
    error?: string;
}

export interface UseAtomicSwapShortResult {
    execute: (
        config: AtomicOperationConfig,
        onDriftShortComplete?: (result: DriftShortResult) => Promise<void>
    ) => Promise<SequentialExecutionResult>;
    progress: AtomicOperationProgress;
    result: SequentialExecutionResult | null;
    isExecuting: boolean;
    reset: () => void;
}

interface UseAtomicSwapShortOptions {
    connection: Connection;
    publicKey: PublicKey | null;
    signTransaction: (<T extends VersionedTransaction>(tx: T) => Promise<T>) | undefined;
    signAllTransactions: (<T extends VersionedTransaction>(txs: T[]) => Promise<T[]>) | undefined;
}

export function useAtomicSwapShort(options: UseAtomicSwapShortOptions): UseAtomicSwapShortResult {
    const { connection, publicKey, signTransaction, signAllTransactions } = options;

    const [progress, setProgress] = useState<AtomicOperationProgress>({
        step: 'idle',
        message: 'Ready',
    });
    const [result, setResult] = useState<SequentialExecutionResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const reset = useCallback(() => {
        setProgress({ step: 'idle', message: 'Ready' });
        setResult(null);
        setIsExecuting(false);
    }, []);

    const execute = useCallback(
        async (
            config: AtomicOperationConfig,
            onDriftShortComplete?: (result: DriftShortResult) => Promise<void>
        ): Promise<SequentialExecutionResult> => {
            if (!publicKey || !signAllTransactions || !signTransaction) {
                const errorResult: SequentialExecutionResult = {
                    success: false,
                    transactions: [],
                    error: 'Wallet not connected',
                };
                setResult(errorResult);
                return errorResult;
            }

            setIsExecuting(true);
            setResult(null);

            const {
                inputToken,
                solAmount,
                usdcAmount,
                shortAmount,
                transferAmount,
                targetAddress,
            } = config;

            // Determine input amount based on selected token
            const inputAmount = inputToken === 'SOL' ? solAmount : usdcAmount;

            let driftClient: DriftClient | null = null;
            let expectedJup = 0;
            let driftShortSignature: string | undefined;
            let calculatedDepositAmount = 0;

            try {
                // Initialize Drift client first (needed for building short transaction)
                setProgress({
                    step: 'initializing',
                    message: 'Initializing Drift client...',
                });

                const browserWallet = new BrowserWallet(
                    publicKey,
                    signTransaction,
                    signAllTransactions
                );
                driftClient = await initializeDriftClient(connection, browserWallet);

                // Define transaction builders (lazy evaluation - each gets fresh blockhash)
                const transactionBuilders: TransactionToBuild[] = [
                    {
                        name: 'Jupiter Swap',
                        build: async () => {
                            const { transaction, expectedOutput } = await buildJupiterSwapTransaction(
                                publicKey,
                                inputToken,
                                'JUP',
                                inputAmount
                            );
                            expectedJup = expectedOutput;
                            return transaction;
                        },
                    },
                    {
                        name: 'Drift Short',
                        build: async () => {
                            // Calculate deposit based on JUP price (1x leverage = 100% margin)
                            const { depositAmount } = await calculateRequiredDepositForShort(shortAmount);
                            calculatedDepositAmount = depositAmount;

                            return buildDriftShortTransaction(
                                connection,
                                publicKey,
                                driftClient!,
                                'JUP-PERP',
                                shortAmount,
                                depositAmount,
                                0
                            );
                        },
                    },
                    {
                        name: 'Token Transfer',
                        build: async () => {
                            return buildTokenTransferTransaction(
                                connection,
                                publicKey,
                                'JUP',
                                targetAddress,
                                transferAmount
                            );
                        },
                    },
                ];

                // Execute transactions sequentially
                const sequentialResult = await executeTransactionsSequentially(
                    connection,
                    signTransaction,
                    transactionBuilders,
                    (txProgress: TransactionProgress[]) => {
                        // Map transaction progress to UI progress
                        const signatures = txProgress
                            .filter((t) => t.signature)
                            .map((t) => t.signature!);

                        const currentTxIndex = txProgress.findIndex(
                            (t) => t.status !== 'confirmed' && t.status !== 'pending'
                        );
                        const currentTx = currentTxIndex >= 0 ? txProgress[currentTxIndex] : null;

                        // Capture Drift Short signature when confirmed
                        const driftTx = txProgress[1];
                        if (driftTx && driftTx.status === 'confirmed' && driftTx.signature) {
                            driftShortSignature = driftTx.signature;
                        }

                        if (currentTx) {
                            let step: AtomicOperationStep;
                            let message: string;

                            switch (currentTx.index) {
                                case 0:
                                    step = 'executing_swap';
                                    message = getSwapMessage(currentTx.status, inputToken, inputAmount, expectedJup);
                                    break;
                                case 1:
                                    step = 'executing_short';
                                    message = getShortMessage(currentTx.status, shortAmount, calculatedDepositAmount);
                                    break;
                                case 2:
                                    step = 'executing_transfer';
                                    message = getTransferMessage(currentTx.status, transferAmount, targetAddress);
                                    break;
                                default:
                                    step = 'executing_swap';
                                    message = 'Processing...';
                            }

                            setProgress({
                                step,
                                message,
                                swapExpectedOutput: expectedJup,
                                currentTransaction: currentTx.index + 1,
                                totalTransactions: 3,
                                transactionSignatures: signatures,
                            });
                        }
                    }
                );

                // Cleanup Drift client
                await cleanupDriftClient(driftClient);
                driftClient = null;

                if (sequentialResult.success) {
                    const signatures = sequentialResult.transactions
                        .filter((t) => t.signature)
                        .map((t) => t.signature!);

                    // Save Drift Short result to Supabase if callback provided
                    if (onDriftShortComplete && driftShortSignature) {
                        const driftResult: DriftShortResult = {
                            marketName: 'JUP-PERP',
                            shortAmount,
                            depositAmount: calculatedDepositAmount,
                            signature: driftShortSignature,
                            timestamp: new Date().toISOString(),
                            status: 'success',
                        };

                        try {
                            await onDriftShortComplete(driftResult);
                            console.log('Drift Short result saved to Supabase');
                        } catch (saveError) {
                            console.error('Failed to save Drift Short result:', saveError);
                            // Don't fail the whole operation if Supabase save fails
                        }
                    }

                    setProgress({
                        step: 'success',
                        message: 'All transactions confirmed!',
                        swapExpectedOutput: expectedJup,
                        currentTransaction: 3,
                        totalTransactions: 3,
                        transactionSignatures: signatures,
                    });
                } else {
                    const failedTx = sequentialResult.transactions[sequentialResult.failedAtIndex!];

                    // If Drift Short failed, still try to save the failed result
                    if (onDriftShortComplete && sequentialResult.failedAtIndex === 1) {
                        const driftResult: DriftShortResult = {
                            marketName: 'JUP-PERP',
                            shortAmount,
                            depositAmount: calculatedDepositAmount,
                            timestamp: new Date().toISOString(),
                            status: 'failed',
                            error: failedTx.error,
                        };

                        try {
                            await onDriftShortComplete(driftResult);
                        } catch (saveError) {
                            console.error('Failed to save Drift Short error:', saveError);
                        }
                    }

                    setProgress({
                        step: 'error',
                        message: `Failed at ${failedTx.name}: ${failedTx.error}`,
                        swapExpectedOutput: expectedJup,
                    });
                }

                setResult(sequentialResult);
                setIsExecuting(false);
                return sequentialResult;
            } catch (error) {
                // Cleanup Drift client on error
                if (driftClient) {
                    await cleanupDriftClient(driftClient);
                }

                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorResult: SequentialExecutionResult = {
                    success: false,
                    transactions: [],
                    error: errorMessage,
                };

                setProgress({
                    step: 'error',
                    message: `Error: ${errorMessage}`,
                });
                setResult(errorResult);
                setIsExecuting(false);
                return errorResult;
            }
        },
        [connection, publicKey, signAllTransactions, signTransaction]
    );

    return {
        execute,
        progress,
        result,
        isExecuting,
        reset,
    };
}

// Helper functions for generating progress messages
function getSwapMessage(
    status: string,
    inputToken: 'SOL' | 'USDC',
    inputAmount: number,
    expectedJup: number
): string {
    switch (status) {
        case 'building':
            return `Building Jupiter swap: ${inputAmount.toFixed(2)} ${inputToken} → JUP...`;
        case 'signing':
            return `Please sign swap transaction in your wallet...`;
        case 'submitting':
            return `Submitting swap: ${inputAmount.toFixed(2)} ${inputToken} → ~${expectedJup.toFixed(4)} JUP...`;
        case 'confirming':
            return `Confirming swap transaction...`;
        default:
            return `Processing swap...`;
    }
}

function getShortMessage(
    status: string,
    shortAmount: number,
    depositAmount?: number
): string {
    const depositMsg = depositAmount ? ` (with ${depositAmount} USDC deposit)` : '';
    switch (status) {
        case 'building':
            return `Building Drift short: ${shortAmount} JUP-PERP${depositMsg}...`;
        case 'signing':
            return `Please sign short position transaction in your wallet...`;
        case 'submitting':
            return `Submitting short position: ${shortAmount} JUP-PERP${depositMsg}...`;
        case 'confirming':
            return `Confirming short position transaction...`;
        default:
            return `Processing short position...`;
    }
}

function getTransferMessage(
    status: string,
    transferAmount: number,
    targetAddress: string
): string {
    const shortAddr = targetAddress.slice(0, 8);
    switch (status) {
        case 'building':
            return `Building JUP transfer: ${transferAmount} JUP → ${shortAddr}...`;
        case 'signing':
            return `Please sign transfer transaction in your wallet...`;
        case 'submitting':
            return `Submitting transfer: ${transferAmount} JUP → ${shortAddr}...`;
        case 'confirming':
            return `Confirming transfer transaction...`;
        default:
            return `Processing transfer...`;
    }
}
