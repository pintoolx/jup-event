import { useState, useCallback } from 'react';
import {
    Connection,
    PublicKey,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import { DriftClient, getUserAccountPublicKeySync } from '@drift-labs/sdk';
import { buildJupiterSwapTransaction, calculateRequiredDepositForShort } from '../utils/jupiter_swap';
import {
    BrowserWallet,
    initializeDriftClient,
    buildDriftDepositTransaction,
    buildDriftShortOnlyTransaction,
    buildDriftLongOnlyTransaction,
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
        onDriftShortComplete?: (result: DriftShortResult) => Promise<void>,
        onTransferComplete?: (transferTx: string) => Promise<void>,
        startFromStep?: number
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
            onDriftShortComplete?: (result: DriftShortResult) => Promise<void>,
            onTransferComplete?: (transferTx: string) => Promise<void>,
            startFromStep: number = 0
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
                mode,
                solAmount,
                usdcAmount,
                shortAmount,
                transferAmount,
                targetAddress,
            } = config;

            // Determine input amount based on selected token
            const inputAmount = inputToken === 'SOL' ? solAmount : usdcAmount;

            // Determine total transactions based on mode
            const totalTransactions = mode === 'standard' ? 2 : 4;

            let driftClient: DriftClient | null = null;
            let expectedJup = 0;
            let driftShortSignature: string | undefined;
            let transferSignature: string | undefined;
            let calculatedDepositAmount = 0;
            let collateralToken: 'SOL' | 'USDC' = inputToken === 'SOL' ? 'SOL' : 'USDC';

            try {
                // subAccountId is only needed for hedge/degen modes
                let subAccountId = 0;

                // Only initialize Drift client for hedge/degen modes (standard mode doesn't use Drift)
                if (mode !== 'standard') {
                    // Initialize Drift client first (needed for building short/long transaction)
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

                    // Ensure Drift user account is loaded
                    let userReady = false;

                    setProgress({
                        step: 'initializing',
                        message: 'Checking Drift account...',
                    });

                    // Step 1: Try to find an existing sub-account (check 0 first, then use getNextSubAccountId)
                    // Get user account public key for sub-account 0
                    const userAccountPubkey0 = getUserAccountPublicKeySync(
                        driftClient.program.programId,
                        publicKey,
                        0
                    );
                    console.log('User account PDA (subAccount 0):', userAccountPubkey0.toBase58());

                    // Check if user account exists using direct RPC call (more reliable than User.exists())
                    // This matches the pattern used by DriftClient's private checkIfAccountExists method
                    let user0Exists = false;
                    try {
                        const accountInfo = await connection.getAccountInfo(userAccountPubkey0);
                        user0Exists = accountInfo !== null;
                        console.log('User sub-account 0 exists on chain:', user0Exists, 'accountInfo:', accountInfo ? 'found' : 'null');
                    } catch (e) {
                        console.log('Error checking account existence:', e);
                        user0Exists = false;
                    }

                    if (user0Exists) {
                        // Sub-account 0 exists, use it
                        subAccountId = 0;
                        setProgress({
                            step: 'initializing',
                            message: 'Loading Drift account...',
                        });

                        try {
                            await driftClient.addUser(subAccountId);
                            // Verify user is subscribed (addUser internally calls user.subscribe())
                            const user = driftClient.getUser(subAccountId);
                            if (!user.isSubscribed) {
                                throw new Error('User subscription failed after addUser()');
                            }
                            console.log('User loaded from chain, authority:', user.getUserAccount().authority.toBase58());
                            userReady = true;
                        } catch (addError) {
                            console.error('Failed to add existing user:', addError);
                            throw new Error(`Failed to load Drift account: ${addError instanceof Error ? addError.message : String(addError)}`);
                        }
                    }

                    // Step 2: If sub-account 0 doesn't exist, get the correct next subAccountId
                    if (!userReady) {
                        // Get the next available subAccountId from UserStats
                        // This is required because Drift tracks number_of_sub_accounts_created
                        // Note: For brand new Drift users, UserStats doesn't exist yet,
                        // so getNextSubAccountId() will fail - we default to 0 in that case
                        try {
                            const nextSubAccountId = await driftClient.getNextSubAccountId();
                            console.log('Next available subAccountId:', nextSubAccountId);
                            subAccountId = nextSubAccountId;
                        } catch (statsError) {
                            // UserStats doesn't exist for new users - default to subAccountId 0
                            console.log('UserStats not found (new Drift user), defaulting to subAccountId 0');
                            subAccountId = 0;
                        }

                        setProgress({
                            step: 'initializing',
                            message: 'Creating Drift margin account...',
                        });

                        try {
                            // Build initialization transaction with the correct subAccountId
                            const [initIxs] = await driftClient.getInitializeUserAccountIxs(subAccountId);
                            console.log('Init instructions count:', initIxs.length, 'for subAccountId:', subAccountId);

                            // Add priority fee only (no compute unit limit)
                            const priceIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 });

                            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
                            const legacyMessage = new TransactionMessage({
                                payerKey: publicKey,
                                recentBlockhash: blockhash,
                                instructions: [priceIx, ...initIxs],
                            }).compileToLegacyMessage();

                            const initTx = new VersionedTransaction(legacyMessage);

                            // Simulate transaction first
                            console.log('Simulating init transaction...');
                            const simulation = await connection.simulateTransaction(initTx);
                            if (simulation.value.err) {
                                console.error('Simulation failed:', simulation.value.err);
                                console.error('Simulation logs:', simulation.value.logs);
                                throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
                            }
                            console.log('Simulation successful, units consumed:', simulation.value.unitsConsumed);

                            // Sign and send
                            const signedInitTx = await signTransaction(initTx);
                            const initSig = await connection.sendRawTransaction(signedInitTx.serialize(), {
                                skipPreflight: false,
                                preflightCommitment: 'confirmed',
                            });
                            console.log('Init transaction sent:', initSig);

                            // Wait for confirmation with timeout
                            await connection.confirmTransaction({
                                signature: initSig,
                                blockhash,
                                lastValidBlockHeight,
                            }, 'confirmed');

                            // Add the new user account to the DriftClient
                            await driftClient.addUser(subAccountId);

                            // Verify user is subscribed
                            const user = driftClient.getUser(subAccountId);
                            if (!user.isSubscribed) {
                                throw new Error('User subscription failed after account creation');
                            }

                            console.log('Drift margin account created:', initSig, 'subAccountId:', subAccountId);
                        } catch (initError) {
                            console.error('Failed to initialize Drift account:', initError);
                            throw new Error(`Failed to create Drift margin account: ${initError instanceof Error ? initError.message : String(initError)}`);
                        }
                    }
                }

                // Define transaction builders based on mode (lazy evaluation - each gets fresh blockhash)
                const swapBuilder: TransactionToBuild = {
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
                };

                const depositBuilder: TransactionToBuild = {
                    name: 'Drift Deposit',
                    build: async () => {
                        // Calculate deposit based on JUP price (1x leverage = 100% margin)
                        // Use SOL as collateral when inputToken is SOL, otherwise use USDC
                        const collateralTokenLocal = inputToken === 'SOL' ? 'SOL' : 'USDC';
                        const { depositAmount } = await calculateRequiredDepositForShort(shortAmount, collateralTokenLocal);
                        calculatedDepositAmount = depositAmount;

                        return buildDriftDepositTransaction(
                            connection,
                            publicKey,
                            driftClient!,
                            depositAmount,
                            collateralTokenLocal,
                            subAccountId
                        );
                    },
                };

                const shortBuilder: TransactionToBuild = {
                    name: 'Drift Short',
                    build: async () => {
                        return buildDriftShortOnlyTransaction(
                            connection,
                            publicKey,
                            driftClient!,
                            'JUP-PERP',
                            shortAmount,
                            subAccountId
                        );
                    },
                };

                const longBuilder: TransactionToBuild = {
                    name: 'Drift Long',
                    build: async () => {
                        return buildDriftLongOnlyTransaction(
                            connection,
                            publicKey,
                            driftClient!,
                            'JUP-PERP',
                            shortAmount,
                            subAccountId
                        );
                    },
                };

                const transferBuilder: TransactionToBuild = {
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
                };

                // Build transaction sequence based on mode
                let transactionBuilders: TransactionToBuild[];
                if (mode === 'standard') {
                    // Standard: swap -> transfer (2 transactions)
                    transactionBuilders = [swapBuilder, transferBuilder];
                } else if (mode === 'degen') {
                    // Degen: swap -> deposit -> long -> transfer (4 transactions)
                    transactionBuilders = [swapBuilder, depositBuilder, longBuilder, transferBuilder];
                } else {
                    // Hedge: swap -> deposit -> short -> transfer (4 transactions)
                    transactionBuilders = [swapBuilder, depositBuilder, shortBuilder, transferBuilder];
                }

                // Slice transaction builders based on startFromStep (for resume functionality)
                const buildersToExecute = transactionBuilders.slice(startFromStep);
                console.log(`Executing from step ${startFromStep}, ${buildersToExecute.length} transactions to execute`);

                // Execute transactions sequentially
                const sequentialResult = await executeTransactionsSequentially(
                    connection,
                    signTransaction,
                    buildersToExecute,
                    (txProgress: TransactionProgress[]) => {
                        // Map transaction progress to UI progress
                        const signatures = txProgress
                            .filter((t) => t.signature)
                            .map((t) => t.signature!);

                        const currentTxIndex = txProgress.findIndex(
                            (t) => t.status !== 'confirmed' && t.status !== 'pending'
                        );
                        const currentTx = currentTxIndex >= 0 ? txProgress[currentTxIndex] : null;

                        // Capture Drift position signature when confirmed (only for hedge/degen modes)
                        // Position (short/long) is at index 2 for hedge/degen modes
                        if (mode !== 'standard') {
                            const positionOriginalIndex = 2;
                            const positionAdjustedIndex = positionOriginalIndex - startFromStep;
                            if (positionAdjustedIndex >= 0 && positionAdjustedIndex < txProgress.length) {
                                const positionTx = txProgress[positionAdjustedIndex];
                                if (positionTx && positionTx.status === 'confirmed' && positionTx.signature) {
                                    driftShortSignature = positionTx.signature;
                                }
                            }
                        }

                        // Capture Token Transfer signature when confirmed
                        // Transfer index: standard=1, hedge/degen=3
                        const transferOriginalIndex = mode === 'standard' ? 1 : 3;
                        const transferAdjustedIndex = transferOriginalIndex - startFromStep;
                        if (transferAdjustedIndex >= 0 && transferAdjustedIndex < txProgress.length) {
                            const transferTx = txProgress[transferAdjustedIndex];
                            if (transferTx && transferTx.status === 'confirmed' && transferTx.signature) {
                                transferSignature = transferTx.signature;
                            }
                        }

                        if (currentTx) {
                            let step: AtomicOperationStep;
                            let message: string;

                            // Adjust the index back to original for UI display
                            const originalIndex = currentTx.index + startFromStep;

                            // Generate message based on transaction name for mode-awareness
                            const txName = currentTx.name;
                            if (txName === 'Jupiter Swap') {
                                step = 'executing_swap';
                                message = getSwapMessage(currentTx.status, inputToken, inputAmount, expectedJup);
                            } else if (txName === 'Drift Deposit') {
                                step = 'executing_short';
                                message = `Depositing ${calculatedDepositAmount.toFixed(2)} ${collateralToken}...`;
                            } else if (txName === 'Drift Short') {
                                step = 'executing_short';
                                message = getShortMessage(currentTx.status, shortAmount, calculatedDepositAmount, collateralToken);
                            } else if (txName === 'Drift Long') {
                                step = 'executing_short';
                                message = getLongMessage(currentTx.status, shortAmount, calculatedDepositAmount, collateralToken);
                            } else if (txName === 'Token Transfer') {
                                step = 'executing_transfer';
                                message = getTransferMessage(currentTx.status, transferAmount, targetAddress);
                            } else {
                                step = 'executing_swap';
                                message = 'Processing...';
                            }

                            setProgress({
                                step,
                                message,
                                swapExpectedOutput: expectedJup,
                                currentTransaction: originalIndex + 1,
                                totalTransactions,
                                transactionSignatures: signatures,
                            });
                        }
                    }
                );

                // Adjust failedAtIndex to account for skipped steps
                if (!sequentialResult.success && sequentialResult.failedAtIndex !== undefined) {
                    sequentialResult.failedAtIndex += startFromStep;
                }

                // Cleanup Drift client (only if it was initialized)
                if (driftClient) {
                    await cleanupDriftClient(driftClient);
                    driftClient = null;
                }

                if (sequentialResult.success) {
                    const signatures = sequentialResult.transactions
                        .filter((t) => t.signature)
                        .map((t) => t.signature!);

                    // Save Drift position result to Supabase if callback provided (only for hedge/degen modes)
                    if (mode !== 'standard' && onDriftShortComplete && driftShortSignature) {
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
                            console.log(`Drift ${mode === 'degen' ? 'Long' : 'Short'} result saved to Supabase`);
                        } catch (saveError) {
                            console.error('Failed to save Drift position result:', saveError);
                            // Don't fail the whole operation if Supabase save fails
                        }
                    }

                    // Save Transfer TX to Supabase if callback provided
                    if (onTransferComplete && transferSignature) {
                        try {
                            await onTransferComplete(transferSignature);
                            console.log('Transfer TX saved to Supabase');
                        } catch (saveError) {
                            console.error('Failed to save Transfer TX:', saveError);
                            // Don't fail the whole operation if Supabase save fails
                        }
                    }

                    setProgress({
                        step: 'success',
                        message: 'All transactions confirmed!',
                        swapExpectedOutput: expectedJup,
                        currentTransaction: totalTransactions,
                        totalTransactions,
                        transactionSignatures: signatures,
                    });
                } else {
                    const failedTx = sequentialResult.transactions[sequentialResult.failedAtIndex!];

                    // If Drift Deposit or position (Short/Long) failed, still try to save the failed result
                    // Only applicable for hedge/degen modes (Index 1 = Deposit, Index 2 = Short/Long)
                    if (mode !== 'standard' && onDriftShortComplete && (sequentialResult.failedAtIndex === 1 || sequentialResult.failedAtIndex === 2)) {
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
                            console.error('Failed to save Drift position error:', saveError);
                        }
                    }

                    setProgress({
                        step: 'error',
                        message: `Failed at ${failedTx.name}: ${failedTx.error}`,
                        swapExpectedOutput: expectedJup,
                        currentTransaction: sequentialResult.failedAtIndex! + 1,
                        totalTransactions,
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
                    currentTransaction: 0,
                    totalTransactions,
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
    depositAmount?: number,
    collateralToken?: 'SOL' | 'USDC'
): string {
    const depositMsg = depositAmount && collateralToken
        ? ` (with ${depositAmount} ${collateralToken} deposit)`
        : '';
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

function getLongMessage(
    status: string,
    longAmount: number,
    depositAmount?: number,
    collateralToken?: 'SOL' | 'USDC'
): string {
    const depositMsg = depositAmount && collateralToken
        ? ` (with ${depositAmount} ${collateralToken} deposit)`
        : '';
    switch (status) {
        case 'building':
            return `Building Drift long: ${longAmount} JUP-PERP${depositMsg}...`;
        case 'signing':
            return `Please sign long position transaction in your wallet...`;
        case 'submitting':
            return `Submitting long position: ${longAmount} JUP-PERP${depositMsg}...`;
        case 'confirming':
            return `Confirming long position transaction...`;
        default:
            return `Processing long position...`;
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
