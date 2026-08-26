import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      throw new Error('Missing TELEGRAM_BOT_TOKEN');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all verified channels
    const { data: channels, error: fetchError } = await supabase
      .from('verified_channels')
      .select('id, channel_username, is_verified')
      .eq('is_verified', true);

    if (fetchError) {
      throw fetchError;
    }

    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ message: "No verified channels to sync." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let updatedCount = 0;
    let failedCount = 0;
    let errors: any[] = [];

    for (const channel of channels) {
      try {
        const username = channel.channel_username;
        
        // Fetch member count from Telegram
        const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${username}`);
        const telegramData = await telegramRes.json();

        if (telegramData.ok) {
          const memberCount = telegramData.result;

          // Update DB
          const { error: updateError } = await supabase
            .from('verified_channels')
            .update({ 
              member_count: memberCount,
              last_updated: new Date().toISOString()
            })
            .eq('id', channel.id);

          if (updateError) {
            console.error(`Failed to update DB for ${username}:`, updateError);
            errors.push({ type: 'db_update', username, error: updateError });
            failedCount++;
          } else {
            updatedCount++;
          }
        } else {
          console.error(`Failed to fetch from Telegram for ${username}:`, telegramData);
          errors.push({ type: 'telegram_api', username, error: telegramData });
          failedCount++;
        }
      } catch (err: any) {
        console.error(`Error processing channel ${channel.channel_username}:`, err);
        errors.push({ type: 'catch', username: channel.channel_username, error: err.message });
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${updatedCount} channels. Failed: ${failedCount}.`,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in sync-telegram-stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
