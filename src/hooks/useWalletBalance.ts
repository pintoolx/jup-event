import { useState, useEffect, useCallback } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { TOKEN_ADDRESS, DegenConfig } from '../types'

// Minimum SOL required for gas fees
const MIN_SOL_FOR_GAS = 0.01

// Drift account initialization reserve (actual ~0.031 SOL)
const DRIFT_INIT_RESERVE = 0.032

// Total SOL reserve for Degen mode (gas + Drift init)
export const TOTAL_SOL_RESERVE = MIN_SOL_FOR_GAS + DRIFT_INIT_RESERVE // 0.042 SOL

// SOL asset weight buffer (1/0.8 = 1.25 + safety buffer)
const SOL_ASSET_WEIGHT_BUFFER = 1.30

export interface WalletBalances {
  sol: number
  usdc: number
  isLoading: boolean
  error: string | null
}

export interface DegenValidationResult {
  isValid: boolean
  error?: string
  requiredCollateral: number
  availableBalance: number
}

/**
 * Hook to fetch and track wallet balances for SOL and USDC
 */
export function useWalletBalance(
  publicKey: PublicKey | null,
  connection: Connection
): WalletBalances & { refetch: () => Promise<void> } {
  const [balances, setBalances] = useState<WalletBalances>({
    sol: 0,
    usdc: 0,
    isLoading: false,
    error: null,
  })

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances({ sol: 0, usdc: 0, isLoading: false, error: null })
      return
    }

    setBalances(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey)
      const solBalanceNumber = solBalance / LAMPORTS_PER_SOL

      // Fetch USDC balance
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

      setBalances({
        sol: solBalanceNumber,
        usdc: usdcBalance,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Failed to fetch wallet balances:', err)
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch balances',
      }))
    }
  }, [publicKey, connection])

  // Fetch balances on mount and when publicKey changes
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  return {
    ...balances,
    refetch: fetchBalances,
  }
}

/**
 * Validate degen configuration against wallet balances
 * @param config - Degen configuration
 * @param balances - Wallet balances
 * @returns Validation result
 */
export function validateDegenConfig(
  config: DegenConfig,
  balances: WalletBalances
): DegenValidationResult {
  const { collateralAmount, collateralToken } = config

  // Get available balance based on collateral token
  let availableBalance: number

  if (collateralToken === 'SOL') {
    // Reserve MIN_SOL_FOR_GAS for gas fees
    availableBalance = Math.max(0, balances.sol - MIN_SOL_FOR_GAS)
  } else {
    // For USDC, check if we have enough SOL for gas
    if (balances.sol < MIN_SOL_FOR_GAS) {
      return {
        isValid: false,
        error: `Insufficient SOL for gas. Need ${MIN_SOL_FOR_GAS} SOL, have ${balances.sol.toFixed(4)} SOL`,
        requiredCollateral: collateralAmount,
        availableBalance: 0,
      }
    }
    availableBalance = balances.usdc
  }

  // Check if collateral amount is specified
  if (collateralAmount <= 0) {
    return {
      isValid: false,
      error: 'Enter collateral amount',
      requiredCollateral: 0,
      availableBalance,
    }
  }

  // Check if enough balance
  if (collateralAmount > availableBalance) {
    const unit = collateralToken === 'SOL' ? 'SOL' : 'USDC'
    const gasNote = collateralToken === 'SOL' ? ` (${MIN_SOL_FOR_GAS} SOL reserved for gas)` : ''
    return {
      isValid: false,
      error: `Insufficient ${unit}. Need ${collateralAmount.toFixed(collateralToken === 'SOL' ? 4 : 2)} ${unit}, have ${availableBalance.toFixed(collateralToken === 'SOL' ? 4 : 2)} ${unit}${gasNote}`,
      requiredCollateral: collateralAmount,
      availableBalance,
    }
  }

  return {
    isValid: true,
    requiredCollateral: collateralAmount,
    availableBalance,
  }
}

/**
 * Extended validation result for Degen mode with total requirements
 */
export interface DegenValidationResultExtended extends DegenValidationResult {
  totalRequired: number
  solRequired: number
  swapCost: number
}

/**
 * Validate degen configuration with swap cost consideration
 * This is used for Degen mode which needs to reserve funds for swap + gas + Drift init
 *
 * @param config - Degen configuration
 * @param balances - Wallet balances
 * @param swapCost - Cost to swap for 250 JUP (in SOL or USDC)
 * @returns Extended validation result with total requirements
 */
export function validateDegenConfigWithSwapCost(
  config: DegenConfig,
  balances: WalletBalances,
  swapCost: number
): DegenValidationResultExtended {
  const { collateralAmount, collateralToken } = config

  // Calculate total requirements
  const { totalRequired, solRequired } = calculateDegenTotalRequired(
    collateralAmount,
    collateralToken,
    swapCost
  )

  // Calculate max available collateral after fees
  const maxAvailable = getMaxCollateralForDegen(balances, collateralToken, swapCost)

  // For USDC mode, check if we have enough SOL for gas + Drift init
  if (collateralToken === 'USDC') {
    if (balances.sol < TOTAL_SOL_RESERVE) {
      return {
        isValid: false,
        error: `Insufficient SOL for fees. Need ${TOTAL_SOL_RESERVE.toFixed(4)} SOL, have ${balances.sol.toFixed(4)} SOL`,
        requiredCollateral: collateralAmount,
        availableBalance: 0,
        totalRequired,
        solRequired,
        swapCost,
      }
    }
  }

  // Check if collateral amount is specified
  if (collateralAmount <= 0) {
    return {
      isValid: false,
      error: 'Enter collateral amount',
      requiredCollateral: 0,
      availableBalance: maxAvailable,
      totalRequired,
      solRequired,
      swapCost,
    }
  }

  // Check if enough balance for collateral
  if (collateralAmount > maxAvailable) {
    const unit = collateralToken === 'SOL' ? 'SOL' : 'USDC'
    return {
      isValid: false,
      error: `Insufficient balance. Max available: ${maxAvailable.toFixed(collateralToken === 'SOL' ? 4 : 2)} ${unit}`,
      requiredCollateral: collateralAmount,
      availableBalance: maxAvailable,
      totalRequired,
      solRequired,
      swapCost,
    }
  }

  // Check total balance (SOL mode only - for USDC we checked SOL separately above)
  if (collateralToken === 'SOL' && balances.sol < totalRequired) {
    return {
      isValid: false,
      error: `Insufficient SOL. Need ${totalRequired.toFixed(4)} SOL total`,
      requiredCollateral: collateralAmount,
      availableBalance: maxAvailable,
      totalRequired,
      solRequired,
      swapCost,
    }
  }

  return {
    isValid: true,
    requiredCollateral: collateralAmount,
    availableBalance: maxAvailable,
    totalRequired,
    solRequired,
    swapCost,
  }
}

/**
 * Calculate required collateral for a leveraged position
 * @param positionSizeJup - Position size in JUP
 * @param leverage - Leverage multiplier (1-10)
 * @param collateralToken - Collateral token type
 * @param jupPrice - Current JUP price in USD
 * @param solPrice - Current SOL price in USD (only needed for SOL collateral)
 * @returns Required collateral amount
 */
export function calculateRequiredCollateral(
  positionSizeJup: number,
  leverage: number,
  collateralToken: 'SOL' | 'USDC',
  jupPrice: number,
  solPrice: number = 0
): {
  collateralRequired: number
  notionalValue: number
  marginRequired: number
} {
  // Position notional value in USD
  const notionalValue = positionSizeJup * jupPrice

  // Required margin in USD = notional / leverage
  const marginRequired = notionalValue / leverage

  let collateralRequired: number

  if (collateralToken === 'SOL') {
    // SOL has 80% asset weight, need 1.30x buffer
    collateralRequired = (marginRequired / solPrice) * SOL_ASSET_WEIGHT_BUFFER
    // Round up to 2 decimal places
    collateralRequired = Math.ceil(collateralRequired * 100) / 100
  } else {
    // USDC is 1:1 with USD
    collateralRequired = Math.ceil(marginRequired)
  }

  return {
    collateralRequired,
    notionalValue,
    marginRequired,
  }
}

/**
 * Calculate estimated liquidation price for a leveraged position
 * @param entryPrice - Entry price of the asset
 * @param leverage - Leverage multiplier
 * @param direction - Position direction
 * @param maintenanceMarginRatio - Maintenance margin ratio (default 5% for JUP-PERP)
 * @returns Liquidation price and percentage change
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  direction: 'long' | 'short',
  maintenanceMarginRatio: number = 0.05
): { liquidationPrice: number; percentageChange: number } {
  // Long: liqPrice = entryPrice * (1 - 1/leverage + maintenanceMargin)
  // Short: liqPrice = entryPrice * (1 + 1/leverage - maintenanceMargin)

  if (direction === 'long') {
    const liqPrice = entryPrice * (1 - (1 / leverage) + maintenanceMarginRatio)
    const percentChange = ((liqPrice - entryPrice) / entryPrice) * 100
    return { liquidationPrice: liqPrice, percentageChange: percentChange }
  } else {
    const liqPrice = entryPrice * (1 + (1 / leverage) - maintenanceMarginRatio)
    const percentChange = ((liqPrice - entryPrice) / entryPrice) * 100
    return { liquidationPrice: liqPrice, percentageChange: percentChange }
  }
}

/**
 * Get maximum available collateral based on balance and token type
 * @param balances - Wallet balances
 * @param collateralToken - Collateral token type
 * @returns Maximum available collateral
 */
export function getMaxCollateral(
  balances: WalletBalances,
  collateralToken: 'SOL' | 'USDC'
): number {
  if (collateralToken === 'SOL') {
    // Reserve MIN_SOL_FOR_GAS for gas
    return Math.max(0, balances.sol - MIN_SOL_FOR_GAS)
  }
  return balances.usdc
}

/**
 * Get maximum available collateral for Degen mode
 * Deducts swap cost, gas, and Drift init reserve from total balance
 *
 * @param balances - Wallet balances
 * @param collateralToken - Collateral token type
 * @param swapCost - Cost to swap for 250 JUP (in SOL or USDC depending on token)
 * @returns Maximum available collateral after deducting fees
 */
export function getMaxCollateralForDegen(
  balances: WalletBalances,
  collateralToken: 'SOL' | 'USDC',
  swapCost: number
): number {
  if (collateralToken === 'SOL') {
    // SOL mode: deduct swap cost + gas + Drift init from SOL balance
    return Math.max(0, balances.sol - swapCost - TOTAL_SOL_RESERVE)
  } else {
    // USDC mode: deduct swap cost from USDC balance
    // (SOL for gas + Drift init is checked separately)
    return Math.max(0, balances.usdc - swapCost)
  }
}

/**
 * Calculate total required balance for Degen mode
 *
 * @param collateralAmount - User-specified collateral amount
 * @param collateralToken - Collateral token type
 * @param swapCost - Cost to swap for 250 JUP
 * @returns Total required amounts
 */
export function calculateDegenTotalRequired(
  collateralAmount: number,
  collateralToken: 'SOL' | 'USDC',
  swapCost: number
): { totalRequired: number; solRequired: number } {
  if (collateralToken === 'SOL') {
    // SOL mode: total = swap + collateral + gas + Drift init
    return {
      totalRequired: swapCost + collateralAmount + TOTAL_SOL_RESERVE,
      solRequired: swapCost + collateralAmount + TOTAL_SOL_RESERVE,
    }
  } else {
    // USDC mode: USDC = swap + collateral, SOL = gas + Drift init
    return {
      totalRequired: swapCost + collateralAmount,
      solRequired: TOTAL_SOL_RESERVE,
    }
  }
}

/**
 * Calculate position size in JUP based on collateral and leverage
 * Position Size (JUP) = (Collateral Value in USD / JUP Price) * Leverage
 *
 * @param collateralAmount - Amount of collateral
 * @param collateralToken - Collateral token type (SOL or USDC)
 * @param leverage - Leverage multiplier (1-10)
 * @param jupPrice - Current JUP price in USD
 * @param solPrice - Current SOL price in USD
 * @returns Position size in JUP (already includes leverage)
 */
export function calculatePositionSizeJup(
  collateralAmount: number,
  collateralToken: 'SOL' | 'USDC',
  leverage: number,
  jupPrice: number,
  solPrice: number
): number {
  if (jupPrice <= 0 || collateralAmount <= 0) return 0
  if (collateralToken === 'SOL' && solPrice <= 0) return 0

  // Calculate collateral value in USD
  const collateralValueUsd = collateralToken === 'SOL'
    ? collateralAmount * solPrice
    : collateralAmount // USDC is 1:1 with USD

  // Position Size = (Collateral USD Value / JUP Price) * Leverage
  const positionSizeJup = (collateralValueUsd / jupPrice) * leverage

  // Round to 4 decimal places
  return Math.floor(positionSizeJup * 10000) / 10000
}
