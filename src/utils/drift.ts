import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  DriftClient,
  PositionDirection,
  OrderType,
  MarketType,
  getOrderParams,
  BN,
  BASE_PRECISION,
  MainnetPerpMarkets,
  initialize,
  IWallet,
  numberToSafeBN,
} from '@drift-labs/sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { TOKEN_ADDRESS, DRIFT_SPOT_MARKETS } from '../types';

// Note: Drift SDK works in browser but needs proper initialization

/**
 * Browser-compatible wallet adapter wrapper for Drift
 * This wraps the wallet adapter to work with Drift SDK
 */
export class BrowserWallet implements IWallet {
  public publicKey: PublicKey;
  public supportedTransactionVersions?: ReadonlySet<'legacy' | 0> = new Set(['legacy', 0]);

  private _signTransaction: <T extends VersionedTransaction>(tx: T) => Promise<T>;
  private _signAllTransactions: <T extends VersionedTransaction>(txs: T[]) => Promise<T[]>;

  constructor(
    publicKey: PublicKey,
    signTransaction: <T extends VersionedTransaction>(tx: T) => Promise<T>,
    signAllTransactions: <T extends VersionedTransaction>(txs: T[]) => Promise<T[]>
  ) {
    this.publicKey = publicKey;
    this._signTransaction = signTransaction;
    this._signAllTransactions = signAllTransactions;
  }

  async signTransaction(tx: any): Promise<any> {
    return this._signTransaction(tx);
  }

  async signAllTransactions(txs: any[]): Promise<any[]> {
    return this._signAllTransactions(txs);
  }

  async signVersionedTransaction(tx: VersionedTransaction): Promise<VersionedTransaction> {
    return this._signTransaction(tx);
  }

  async signAllVersionedTransactions(txs: VersionedTransaction[]): Promise<VersionedTransaction[]> {
    return this._signAllTransactions(txs);
  }

  get payer() {
    return {
      publicKey: this.publicKey,
    } as any;
  }
}

/**
 * Get perp market index by name
 */
export function getPerpMarketIndex(marketName: string): number {
  const market = MainnetPerpMarkets.find((m) => m.symbol === marketName);
  if (!market) {
    throw new Error(`Market ${marketName} not found`);
  }
  return market.marketIndex;
}

/**
 * Initialize Drift client for browser
 */
export async function initializeDriftClient(
  connection: Connection,
  wallet: BrowserWallet
): Promise<DriftClient> {
  const sdkConfig = initialize({ env: 'mainnet-beta' });

  const driftClient = new DriftClient({
    connection,
    wallet,
    env: 'mainnet-beta',
    programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
  });

  // Subscribe and check the return value
  const subscribeSuccess = await driftClient.subscribe();
  if (!subscribeSuccess) {
    throw new Error('DriftClient subscription failed');
  }

  // Additional verification that subscription is complete
  if (!driftClient.isSubscribed) {
    throw new Error('DriftClient is not subscribed after subscribe() call');
  }

  return driftClient;
}

/**
 * Build deposit instruction for Drift margin account
 * @param driftClient - Drift client instance
 * @param depositAmount - Amount to deposit
 * @param collateralToken - Token to use as collateral ('USDC' or 'SOL')
 * @param subAccountId - Sub-account ID
 * @param userInitialized - Whether user is already initialized
 */
export async function buildDepositInstruction(
  driftClient: DriftClient,
  depositAmount: number,
  collateralToken: 'USDC' | 'SOL' = 'USDC',
  subAccountId: number = 0,
  userInitialized: boolean = true
): Promise<TransactionInstruction> {
  let amount: BN;
  let spotMarketIndex: number;
  let mint: PublicKey;

  if (collateralToken === 'SOL') {
    // SOL has 9 decimals
    amount = new BN(depositAmount * 1e9);
    spotMarketIndex = DRIFT_SPOT_MARKETS.SOL;
    mint = new PublicKey(TOKEN_ADDRESS.SOL);
  } else {
    // USDC has 6 decimals
    amount = new BN(depositAmount * 1e6);
    spotMarketIndex = DRIFT_SPOT_MARKETS.USDC;
    mint = new PublicKey(TOKEN_ADDRESS.USDC);
  }

  const userTokenAccount = await getAssociatedTokenAddress(
    mint,
    driftClient.wallet.publicKey
  );

  const depositIx = await driftClient.getDepositInstruction(
    amount,
    spotMarketIndex,
    userTokenAccount,
    subAccountId,
    false,
    userInitialized
  );

  return depositIx;
}

/**
 * Build Drift short position instructions
 */
export async function buildDriftShortInstructions(
  driftClient: DriftClient,
  marketIndex: number,
  baseAssetAmount: number,
  depositAmount?: number,
  collateralToken: 'USDC' | 'SOL' = 'USDC',
  subAccountId: number = 0
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = [];

  // User account must exist before calling this function
  // Initialization is handled separately in useAtomicSwapShort.ts

  // Add deposit instruction if depositAmount is specified
  if (depositAmount && depositAmount > 0) {
    const depositIx = await buildDepositInstruction(
      driftClient,
      depositAmount,
      collateralToken,
      subAccountId,
      true // User is already initialized
    );
    instructions.push(depositIx);
  }

  // Convert base asset amount to proper precision using SDK's safe conversion
  // This correctly handles decimal values like 0.5 or 1.5
  const baseAmount = numberToSafeBN(baseAssetAmount, BASE_PRECISION);

  // Get oracle price for slippage protection
  const oracleData = driftClient.getOracleDataForPerpMarket(marketIndex);
  if (!oracleData || !oracleData.price) {
    throw new Error(`Unable to get oracle data for market index ${marketIndex}. Make sure DriftClient is subscribed.`);
  }
  const price = oracleData.price;

  // Build order params for market short
  const orderParams = getOrderParams({
    orderType: OrderType.MARKET,
    marketType: MarketType.PERP,
    marketIndex,
    direction: PositionDirection.SHORT,
    baseAssetAmount: baseAmount,
    price: price.mul(new BN(95)).div(new BN(100)),
  });

  const shortIx = await driftClient.getPlacePerpOrderIx(orderParams, subAccountId);
  instructions.push(shortIx);

  return instructions;
}

/**
 * Build deposit transaction (unsigned) using Legacy Message
 *
 * Uses Legacy Message instead of V0 to ensure compatibility.
 * Always fetches fresh blockhash for sequential execution.
 */
export async function buildDriftDepositTransaction(
  connection: Connection,
  userPublicKey: PublicKey,
  driftClient: DriftClient,
  depositAmount: number,
  collateralToken: 'USDC' | 'SOL' = 'USDC',
  subAccountId: number = 0
): Promise<VersionedTransaction> {
  const instructions: TransactionInstruction[] = [];

  // User account must exist before calling this function
  // Initialization is handled separately in useAtomicSwapShort.ts

  // Add deposit instruction
  const depositIx = await buildDepositInstruction(
    driftClient,
    depositAmount,
    collateralToken,
    subAccountId,
    true // User is already initialized
  );
  instructions.push(depositIx);

  // Add compute budget
  const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000,
  });
  const priceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });

  // Always fetch fresh blockhash for sequential execution
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // Build transaction using Legacy Message (Jito compatible - no ALT support)
  const legacyMessage = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: [computeIx, priceIx, ...instructions],
  }).compileToLegacyMessage();

  const transaction = new VersionedTransaction(legacyMessage);

  // Verify base64 serialization works
  verifyTransactionSerializable(transaction);

  return transaction;
}

/**
 * Build complete Drift short transaction with optional deposit (unsigned)
 *
 * Uses Legacy Message instead of V0 to ensure compatibility.
 * Always fetches fresh blockhash for sequential execution.
 */
export async function buildDriftShortTransaction(
  connection: Connection,
  userPublicKey: PublicKey,
  driftClient: DriftClient,
  marketName: string,
  baseAssetAmount: number,
  depositAmount?: number,
  collateralToken: 'USDC' | 'SOL' = 'USDC',
  subAccountId: number = 0
): Promise<VersionedTransaction> {
  const marketIndex = getPerpMarketIndex(marketName);

  // Get instructions (includes deposit if specified)
  const instructions = await buildDriftShortInstructions(
    driftClient,
    marketIndex,
    baseAssetAmount,
    depositAmount,
    collateralToken,
    subAccountId
  );

  // Add compute budget - higher if deposit is included
  const computeUnits = depositAmount ? 800_000 : 600_000;
  const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const priceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });

  // Always fetch fresh blockhash for sequential execution
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // Build transaction using Legacy Message (Jito compatible - no ALT support)
  const legacyMessage = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: [computeIx, priceIx, ...instructions],
  }).compileToLegacyMessage();

  const transaction = new VersionedTransaction(legacyMessage);

  // Verify base64 serialization works
  verifyTransactionSerializable(transaction);

  return transaction;
}

/**
 * Verify transaction can be serialized to base64 (for Jito bundle)
 * Throws if transaction is too large or has other serialization issues
 */
function verifyTransactionSerializable(transaction: VersionedTransaction): void {
  try {
    const serialized = transaction.serialize();
    const base64 = Buffer.from(serialized).toString('base64');
    
    // Verify round-trip
    const decoded = Buffer.from(base64, 'base64');
    VersionedTransaction.deserialize(decoded);

    // Check transaction size limit (1232 bytes max)
    if (serialized.length > 1232) {
      console.warn(`Transaction size (${serialized.length} bytes) exceeds limit. Consider splitting.`);
    }
  } catch (error) {
    throw new Error(`Transaction serialization failed: ${error}`);
  }
}

/**
 * Get transaction as base64 string (for Jito bundle submission)
 */
export function getTransactionBase64(transaction: VersionedTransaction): string {
  const serialized = transaction.serialize();
  return Buffer.from(serialized).toString('base64');
}

/**
 * Cleanup Drift client
 */
export async function cleanupDriftClient(driftClient: DriftClient): Promise<void> {
  await driftClient.unsubscribe();
}