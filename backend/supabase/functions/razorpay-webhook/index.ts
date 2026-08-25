// ═══════════════════════════════════════════════════════════
// GINGER — Edge Function: Razorpay Webhook
// Processes payment.captured events and updates wallet
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.173.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Invalid signature or secret not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payloadString = await req.text();
    
    // Verify signature using HMAC SHA256
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      new TextEncoder().encode(payloadString)
    );
    
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignatureHex !== signature) {
      return new Response(JSON.stringify({ error: 'Signature mismatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(payloadString);
    const event = payload.event;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const amount = paymentEntity.amount / 100; // Convert paise to INR
      const userId = paymentEntity.notes?.user_id;
      const description = paymentEntity.notes?.purpose || 'Wallet Deposit via Razorpay';

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing user_id in notes' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if this payment is already processed
      const { data: existingTx } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('reference_id', paymentEntity.id)
        .single();

      if (!existingTx) {
        const { error: insertError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            reference_id: paymentEntity.id,
            description: description
          });

        if (insertError) {
          throw insertError;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
