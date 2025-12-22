// Supabase Edge Function: Save Transfer TX
// Saves the JUP transfer transaction signature to user's transfer_tx field

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface SaveTransferTxRequest {
    wallet_address: string
    transfer_tx: string
}

interface SaveTransferTxResponse {
    success: boolean
    error?: string
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
        const body: SaveTransferTxRequest = await req.json()

        // Validate request
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

        if (!body.transfer_tx || typeof body.transfer_tx !== 'string') {
            return new Response(
                JSON.stringify({ success: false, error: 'transfer_tx is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        // Use service_role key to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Update the user's transfer_tx
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                transfer_tx: body.transfer_tx.trim(),
                last_active_at: new Date().toISOString(),
            })
            .eq('wallet_address', body.wallet_address.trim())

        if (updateError) {
            console.error('Failed to update transfer_tx:', updateError)
            return new Response(
                JSON.stringify({ success: false, error: `Failed to save: ${updateError.message}` }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                }
            )
        }

        console.log('Transfer TX saved for:', body.wallet_address, 'tx:', body.transfer_tx)
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
