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
    if (!code || !redirect_uri || !profile_id) {
      throw new Error("Missing required parameters: code, redirect_uri, or profile_id");
    }

    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      throw new Error("Instagram client credentials not configured on the server");
    }

    // Step 1: Exchange code for short-lived token
    const tokenFormData = new URLSearchParams();
    tokenFormData.append('client_id', INSTAGRAM_CLIENT_ID);
    tokenFormData.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirect_uri);
    tokenFormData.append('code', code);

    console.log("Step 1: Exchanging code for token...");
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenFormData.toString(),
    });

    const tokenText = await tokenRes.text();
    console.log("Token response status:", tokenRes.status);
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      throw new Error(`Instagram returned non-JSON: ${tokenText}`);
    }

    if (!tokenData.access_token || !tokenData.user_id) {
      throw new Error(`Token exchange failed: ${tokenData.error_message || tokenData.error_type || JSON.stringify(tokenData)}`);
    }

    const shortToken = tokenData.access_token;
    const userId = tokenData.user_id;
    console.log("Got token! user_id:", userId);

    // Step 2: Fetch profile using graph.facebook.com (NOT graph.instagram.com!)
    // The Instagram API with Instagram Login uses graph.facebook.com for data fetching
    let username = '';
    let followers = 0;

    // Approach A: graph.facebook.com/v20.0/me (correct endpoint for Instagram Business Login)
    console.log("Step 2A: Trying graph.facebook.com/v20.0/me...");
    const fbMeRes = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,username,name,followers_count&access_token=${shortToken}`
    );
    const fbMeText = await fbMeRes.text();
    console.log("  graph.facebook.com/me response:", fbMeRes.status, fbMeText);

    let fbMeData;
    try { fbMeData = JSON.parse(fbMeText); } catch { fbMeData = null; }

    if (fbMeData && fbMeData.username) {
      username = fbMeData.username;
      followers = fbMeData.followers_count || 0;
      console.log("  Approach A SUCCESS:", username, followers);
    } else {
      // Approach B: graph.facebook.com with explicit user_id
      console.log("Step 2B: Trying graph.facebook.com/{user_id}...");
      const fbIdRes = await fetch(
        `https://graph.facebook.com/v20.0/${userId}?fields=id,username,name,followers_count&access_token=${shortToken}`
      );
      const fbIdText = await fbIdRes.text();
      console.log("  graph.facebook.com/{id} response:", fbIdRes.status, fbIdText);

      let fbIdData;
      try { fbIdData = JSON.parse(fbIdText); } catch { fbIdData = null; }

      if (fbIdData && fbIdData.username) {
        username = fbIdData.username;
        followers = fbIdData.followers_count || 0;
        console.log("  Approach B SUCCESS:", username, followers);
      } else {
        // Approach C: Try graph.instagram.com as last resort (just in case)
        console.log("Step 2C: Trying graph.instagram.com/me as fallback...");
        const igRes = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${shortToken}`
        );
        const igText = await igRes.text();
        console.log("  graph.instagram.com/me response:", igRes.status, igText);

        let igData;
        try { igData = JSON.parse(igText); } catch { igData = null; }

        if (igData && igData.username) {
          username = igData.username;
          followers = igData.followers_count || 0;
          console.log("  Approach C SUCCESS:", username);
        } else {
          throw new Error(
            `Could not fetch Instagram profile. ` +
            `A (fb/me): ${fbMeText} | ` +
            `B (fb/${userId}): ${fbIdText} | ` +
            `C (ig/me): ${igText}`
          );
        }
      }
    }

    console.log("=== FINAL RESULT: username:", username, "followers:", followers, "===");

    return new Response(
      JSON.stringify({
        success: true,
        username,
        followers,
        access_token: shortToken
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