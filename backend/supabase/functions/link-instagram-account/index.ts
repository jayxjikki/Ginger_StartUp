import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const INSTAGRAM_CLIENT_ID = Deno.env.get('VITE_INSTAGRAM_CLIENT_ID') || '';
const INSTAGRAM_CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri, profile_id } = await req.json();

    console.log("=== INSTAGRAM LINK START ===");
    console.log("redirect_uri:", redirect_uri);
    console.log("profile_id:", profile_id);
    console.log("Client ID present:", !!INSTAGRAM_CLIENT_ID);
    console.log("Client Secret present:", !!INSTAGRAM_CLIENT_SECRET);

    if (!code || !redirect_uri || !profile_id) {
      throw new Error("Missing required parameters: code, redirect_uri, or profile_id");
    }

    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      throw new Error("Instagram client credentials not configured on the server");
    }

    // Step 1: Exchange authorization code for short-lived token
    const tokenFormData = new URLSearchParams();
    tokenFormData.append('client_id', INSTAGRAM_CLIENT_ID);
    tokenFormData.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirect_uri);
    tokenFormData.append('code', code);

    console.log("Step 1: Exchanging code for short-lived token...");

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenFormData.toString(),
    });

    const tokenText = await tokenRes.text();
    console.log("Token response status:", tokenRes.status);
    console.log("Token response:", tokenText);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      throw new Error(`Instagram returned non-JSON: ${tokenText}`);
    }

    if (!tokenData.access_token) {
      throw new Error(`Token exchange failed: ${tokenData.error_message || tokenData.error_type || 'No access_token'}`);
    }

    const shortToken = tokenData.access_token;
    const igUserId = tokenData.user_id;
    console.log("Got token! user_id:", igUserId);

    // Step 2: Exchange for long-lived token (60 days)
    let longToken = shortToken;
    console.log("Step 2: Exchanging for long-lived token...");
    try {
      const llRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${shortToken}`
      );
      const llText = await llRes.text();
      console.log("Long-lived response:", llText);
      const llData = JSON.parse(llText);
      if (llData.access_token) {
        longToken = llData.access_token;
        console.log("Long-lived token obtained!");
      }
    } catch (e) {
      console.error("Long-lived token failed (will use short-lived):", e);
    }

    // Step 3: Fetch profile - try multiple approaches
    let username = '';
    let followers = 0;
    
    // Approach A: Use /me endpoint with long-lived token
    console.log("Step 3A: Trying /me endpoint...");
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=user_id,username,followers_count&access_token=${longToken}`
    );
    const meText = await meRes.text();
    console.log("  /me status:", meRes.status, "body:", meText);

    let meData;
    try { meData = JSON.parse(meText); } catch { meData = null; }

    if (meData && meData.username) {
      username = meData.username;
      followers = meData.followers_count || 0;
      console.log("  /me SUCCESS:", username, followers);
    } else {
      // Approach B: Use user_id endpoint with short-lived token
      console.log("Step 3B: Trying /{user_id} with short token...");
      const idRes = await fetch(
        `https://graph.instagram.com/${igUserId}?fields=user_id,username,followers_count&access_token=${shortToken}`
      );
      const idText = await idRes.text();
      console.log("  /{id} status:", idRes.status, "body:", idText);

      let idData;
      try { idData = JSON.parse(idText); } catch { idData = null; }

      if (idData && idData.username) {
        username = idData.username;
        followers = idData.followers_count || 0;
        console.log("  /{id} SUCCESS:", username, followers);
      } else {
        // Approach C: Try with just username field (maybe followers_count needs extra permission)
        console.log("Step 3C: Trying with just username field...");
        const minRes = await fetch(
          `https://graph.instagram.com/me?fields=username&access_token=${shortToken}`
        );
        const minText = await minRes.text();
        console.log("  minimal status:", minRes.status, "body:", minText);

        let minData;
        try { minData = JSON.parse(minText); } catch { minData = null; }

        if (minData && minData.username) {
          username = minData.username;
          console.log("  minimal SUCCESS:", username);
        } else {
          // All approaches failed
          const allErrors = `Approach A: ${meText} | Approach B: ${idText} | Approach C: ${minText}`;
          throw new Error(`Could not fetch Instagram profile. Details: ${allErrors}`);
        }
      }
    }

    console.log("=== FINAL RESULT: username:", username, "followers:", followers, "===");

    return new Response(
      JSON.stringify({
        success: true,
        username,
        followers,
        access_token: longToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("=== FUNCTION ERROR:", error.message, "===");
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
