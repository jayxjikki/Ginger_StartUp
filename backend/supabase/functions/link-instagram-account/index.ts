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

    // Step 1: Exchange code for token
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
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      throw new Error(`Instagram returned non-JSON: ${tokenText}`);
    }

    if (!tokenData.access_token || !tokenData.user_id) {
      throw new Error(`Token exchange failed: ${tokenData.error_message || tokenData.error_type || 'No access_token'}`);
    }

    const shortToken = tokenData.access_token;
    const userId = tokenData.user_id;
    console.log("Got token! user_id:", userId);

    // Step 2: Fetch profile using /me and only basic fields first
    let username = '';
    let followers = 0;

    console.log(`Step 2: Fetching profile for /me using v21.0...`);

    // Try just username and id first
    const basicProfileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${shortToken}`
    );

    const basicProfileText = await basicProfileRes.text();
    console.log("Basic Profile Fetch Response:", basicProfileRes.status, basicProfileText);

    let basicProfileData;
    try { basicProfileData = JSON.parse(basicProfileText); } catch { basicProfileData = null; }

    if (basicProfileData && basicProfileData.username) {
      username = basicProfileData.username;
      
      // Try getting followers count separately
      try {
        const followersRes = await fetch(
          `https://graph.instagram.com/v21.0/me?fields=followers_count&access_token=${shortToken}`
        );
        const followersData = await followersRes.json();
        if (followersData.followers_count !== undefined) {
          followers = followersData.followers_count;
        }
      } catch (e) {
        console.log("Could not fetch followers, defaulting to 0");
      }

      console.log("SUCCESS! Username:", username, "Followers:", followers);
    } else {
      throw new Error(`Failed to fetch basic profile data. API Response: ${basicProfileText}`);
    }

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