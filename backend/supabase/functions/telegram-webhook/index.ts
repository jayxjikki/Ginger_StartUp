import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const update = await req.json();

    // Check if the message is "/start <token>"
    if (update.message?.text?.startsWith('/start ')) {
      const token = update.message.text.split(' ')[1]?.trim();
      const telegramUser = update.message.from;
      
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

      // Verified directly by Telegram
      if (token && telegramUser && supabaseUrl && supabaseServiceKey) {
        // Initialize Supabase admin client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Find profile with this verification token
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('verify_token', token)
          .single();

        if (profile && !error) {
          // 2. Link Telegram ID and delete one-time token
          await supabase
            .from('profiles')
            .update({
              telegram_id: telegramUser.id,
              telegram_username: telegramUser.username || telegramUser.first_name,
              verify_token: null,
            })
            .eq('id', profile.id);

          // 3. Send confirmation in Telegram
          if (botToken) {
            await fetch(
              `https://api.telegram.org/bot${botToken}/sendMessage`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  chat_id: update.message.chat.id,
                  text: '✅ Your Telegram account has been successfully linked! You can go back to the website.',
                }),
              }
            );
          }
        } else {
            if (botToken) {
                await fetch(
                  `https://api.telegram.org/bot${botToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      chat_id: update.message.chat.id,
                      text: '❌ Invalid or expired verification token. Please try connecting again from the website.',
                    }),
                  }
                );
            }
        }
      }
    }

    // Always respond 200 OK so Telegram doesn't retry
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
