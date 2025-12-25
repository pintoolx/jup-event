// Supabase Edge Function: Update Current Status
// Updates the user's current_status field for transaction tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface CurrentStatus {
    status: 'success' | 'failed';
    ticker?: 'SOL' | 'USDC';
    transaction?: 1 | 2 | 3 | 4;
    mode?: 'standard' | 'hedge' | 'degen';
}

interface UpdateStatusRequest {
    wallet_address: string;
    status: CurrentStatus;
}

interface UpdateStatusResponse {
    success: boolean;
    error?: string;
}

serve(async (req) => {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        )
    }

    try {
        const body: UpdateStatusRequest = await req.json()

        // Validate wallet_address
        if (!body.wallet_address || typeof body.wallet_address !== 'string') {
            return new Response(
                JSON.stringify({ success: false, error: 'wallet_address is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        // Validate status
        if (!body.status || typeof body.status !== 'object') {
            return new Response(
                JSON.stringify({ success: false, error: 'status is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        // Validate status.status field
        if (body.status.status !== 'success' && body.status.status !== 'failed') {
            return new Response(
                JSON.stringify({ success: false, error: 'status.status must be "success" or "failed"' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        // Validate failed status has required fields
        if (body.status.status === 'failed') {
            if (!body.status.ticker || (body.status.ticker !== 'SOL' && body.status.ticker !== 'USDC')) {
                return new Response(
                    JSON.stringify({ success: false, error: 'ticker is required for failed status and must be "SOL" or "USDC"' }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                )
            }

            // Validate mode
            if (!body.status.mode || !['standard', 'hedge', 'degen'].includes(body.status.mode)) {
                return new Response(
                    JSON.stringify({ success: false, error: 'mode is required for failed status and must be "standard", "hedge", or "degen"' }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                )
            }

            // Validate transaction based on mode (standard: 1-2, hedge/degen: 1-4)
            const maxTransaction = body.status.mode === 'standard' ? 2 : 4
            if (!body.status.transaction || body.status.transaction < 1 || body.status.transaction > maxTransaction) {
                return new Response(
                    JSON.stringify({ success: false, error: `transaction is required for failed status and must be 1-${maxTransaction} for ${body.status.mode} mode` }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    }
                )
            }
        }

        // Use service_role key to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Build the status object to save
        const statusToSave: CurrentStatus = body.status.status === 'success'
            ? { status: 'success' }
            : {
                status: 'failed',
                ticker: body.status.ticker,
                transaction: body.status.transaction,
                mode: body.status.mode
            }

        // Update the user's current_status
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                current_status: statusToSave,
                last_active_at: new Date().toISOString(),
            })
            .eq('wallet_address', body.wallet_address.trim())

        if (updateError) {
            console.error('Failed to update current_status:', updateError)
            return new Response(
                JSON.stringify({ success: false, error: `Failed to update: ${updateError.message}` }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        console.log('Current status updated for:', body.wallet_address, statusToSave)
        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        )
    } catch (err) {
        return new Response(
            JSON.stringify({
                success: false,
                error: `Invalid request: ${err instanceof Error ? err.message : 'Unknown error'}`
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        )
    }
})
