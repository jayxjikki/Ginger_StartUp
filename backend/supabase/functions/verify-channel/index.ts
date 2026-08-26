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
    const { userId, channelUsername } = await req.json();

    if (!userId || !channelUsername) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

    if (!botToken) {
       return new Response(JSON.stringify({ error: 'Bot token not configured' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get the user's verified Telegram ID from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.telegram_id) {
      return new Response(JSON.stringify({ error: 'Please connect your Telegram account first.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Format the channel name properly (must start with @ for public channels)
    const formattedChannel = channelUsername.startsWith('@') 
      ? channelUsername 
      : `@${channelUsername}`;

    // 3. Ask Telegram for the list of administrators in this channel/group
    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatAdministrators?chat_id=${formattedChannel}`
    );
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(JSON.stringify({ 
        error: 'Bot is not an admin in that channel, or the channel does not exist/is not public.' 
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Look for the user's Telegram ID in the list of admins
    const adminRecord = tgData.result.find(
      (admin: any) => admin.user.id.toString() === profile.telegram_id.toString()
    );

    // 5. Check their status. 'creator' means they are the owner.
    if (adminRecord && adminRecord.status === 'creator') {
      
      let memberCount = 0;
      try {
        const countRes = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${formattedChannel}`);
        const countData = await countRes.json();
        if (countData.ok) {
           memberCount = countData.result;
        }
      } catch(e) {
        console.error("Failed to fetch member count during verification", e);
      }

      // Check if it already exists
      const { data: existing } = await supabase
        .from('verified_channels')
        .select('id')
        .eq('profile_id', userId)
        .eq('channel_username', formattedChannel)
        .single();
        
      if (!existing) {
        // Verification passed! Save to the verified_channels table
        await supabase.from('verified_channels').insert({
          profile_id: userId,
          channel_username: formattedChannel,
          is_verified: true,
          member_count: memberCount
        });
      } else {
        await supabase.from('verified_channels').update({ member_count: memberCount }).eq('id', existing.id);
      }

      return new Response(JSON.stringify({ success: true, message: 'Channel verified successfully!' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ 
      error: 'You are not the owner or administrator of this channel.' 
    }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error('Channel verification error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
