import { Connection, VersionedTransaction } from '@solana/web3.js';

/**
 * Status of individual transaction execution
 */
export type TransactionExecutionStatus =
  | 'pending'
  | 'building'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed';

/**
 * Progress tracking for each transaction
 */
export interface TransactionProgress {
  index: number;
  name: string;
  status: TransactionExecutionStatus;
  signature?: string;
  error?: string;
}

/**
 * Result of sequential execution
 */
export interface SequentialExecutionResult {
  success: boolean;
  transactions: TransactionProgress[];
  error?: string;
  failedAtIndex?: number;
}

/**
 * Lazy transaction builder interface
 * The build function is called just before signing to get fresh blockhash
 */
export interface TransactionToBuild {
  name: string;
  build: () => Promise<VersionedTransaction>;
}

/**
 * Execute transactions sequentially with fresh blockhash per transaction.
 * Stops on first failure.
 *
 * @param connection - Solana RPC connection
 * @param signTransaction - Wallet adapter's signTransaction function
 * @param transactionBuilders - Array of lazy transaction builders
 * @param onProgress - Optional callback for progress updates
 * @returns Result containing success status and transaction details
 */
export async function executeTransactionsSequentially(
  connection: Connection,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
  transactionBuilders: TransactionToBuild[],
  onProgress?: (progress: TransactionProgress[]) => void
): Promise<SequentialExecutionResult> {
  const results: TransactionProgress[] = transactionBuilders.map((builder, index) => ({
    index,
    name: builder.name,
    status: 'pending' as TransactionExecutionStatus,
  }));

  const updateProgress = (index: number, updates: Partial<TransactionProgress>) => {
    results[index] = { ...results[index], ...updates };
    onProgress?.([...results]);
  };

  for (let i = 0; i < transactionBuilders.length; i++) {
    const builder = transactionBuilders[i];

    try {
      // Step 1: Build transaction (gets fresh blockhash)
      updateProgress(i, { status: 'building' });
      const tx = await builder.build();

      // Step 2: Sign with wallet
      updateProgress(i, { status: 'signing' });
      const signedTx = await signTransaction(tx);

      // Step 3: Simulate first to catch errors early
      updateProgress(i, { status: 'submitting' });
      console.log(`Simulating transaction ${i + 1}: ${builder.name}`);
      const simulation = await connection.simulateTransaction(signedTx, {
        commitment: 'confirmed',
      });

      if (simulation.value.err) {
        const simError = `Simulation failed: ${JSON.stringify(simulation.value.err)}\nLogs: ${simulation.value.logs?.join('\n') || 'no logs'}`;
        console.error('Simulation error:', simError);
        throw new Error(simError);
      }
      console.log(`Simulation successful for ${builder.name}, units consumed: ${simulation.value.unitsConsumed}`);

      // Step 4: Submit to network
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true, // Already simulated
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      // Step 4: Confirm transaction
      updateProgress(i, { status: 'confirming', signature });

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        const errorMsg = `Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`;
        updateProgress(i, { status: 'failed', error: errorMsg });
        return {
          success: false,
          transactions: results,
          error: errorMsg,
          failedAtIndex: i,
        };
      }

      // Success
      updateProgress(i, { status: 'confirmed' });
      console.log(`Transaction ${i + 1}/${transactionBuilders.length} confirmed: ${signature}`);

    } catch (error) {
      // Improved error handling to capture full error details
      let errorMsg: string;
      if (error instanceof Error) {
        errorMsg = error.message;
        // Check for Solana-specific error details
        if ('logs' in error && Array.isArray((error as any).logs)) {
          errorMsg += '\nLogs: ' + (error as any).logs.join('\n');
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle object errors (common with Solana RPC errors)
        try {
          errorMsg = JSON.stringify(error, null, 2);
        } catch {
          errorMsg = String(error);
        }
      } else {
        errorMsg = String(error);
      }

      console.error('Transaction execution error:', error);
      console.error('Error message:', errorMsg);

      updateProgress(i, { status: 'failed', error: errorMsg });

      return {
        success: false,
        transactions: results,
        error: errorMsg,
        failedAtIndex: i,
      };
    }
  }

  return {
    success: true,
    transactions: results,
  };
}
