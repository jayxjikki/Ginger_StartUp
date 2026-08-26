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

    console.log("Received request:", { code: code?.substring(0, 10) + '...', redirect_uri, profile_id });
    console.log("Client ID present:", !!INSTAGRAM_CLIENT_ID, "Secret present:", !!INSTAGRAM_CLIENT_SECRET);

    if (!code || !redirect_uri || !profile_id) {
      throw new Error("Missing required parameters: code, redirect_uri, or profile_id");
    }

    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      throw new Error("Instagram client credentials not configured on the server");
    }

    // 1. Exchange the code for a short-lived access token
    const tokenFormData = new URLSearchParams();
    tokenFormData.append('client_id', INSTAGRAM_CLIENT_ID);
    tokenFormData.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirect_uri);
    tokenFormData.append('code', code);

    console.log("Exchanging code for token...");
    console.log("Token request body:", tokenFormData.toString());

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenFormData.toString(),
    });

    const tokenText = await tokenRes.text();
    console.log("Token response status:", tokenRes.status);
    console.log("Token response body:", tokenText);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      throw new Error(`Instagram returned non-JSON response: ${tokenText}`);
    }
    
    if (tokenData.error_type || tokenData.error_message || !tokenData.access_token) {
      throw new Error(`Token exchange failed: ${tokenData.error_message || tokenData.error_type || 'No access_token in response'}`);
    }

    const shortLivedToken = tokenData.access_token;
    const igUserId = tokenData.user_id;
    console.log("Got short-lived token, user_id:", igUserId);

    // 2. Exchange short-lived token for long-lived token
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${shortLivedToken}`
    );
    const longLivedData = await longLivedRes.json();
    console.log("Long-lived token response:", JSON.stringify(longLivedData));
    
    const finalToken = longLivedData.access_token || shortLivedToken;

    // 3. Fetch user profile data and followers using the token
    const profileRes = await fetch(`https://graph.instagram.com/v22.0/me?fields=user_id,username,account_type,followers_count,media_count&access_token=${finalToken}`);
    const profileText = await profileRes.text();
    console.log("Profile response status:", profileRes.status);
    console.log("Profile response body:", profileText);

    let profileData;
    try {
      profileData = JSON.parse(profileText);
    } catch {
      throw new Error(`Instagram profile API returned non-JSON: ${profileText}`);
    }

    if (profileData.error) {
      throw new Error(`Failed to fetch Instagram profile: ${profileData.error.message || JSON.stringify(profileData.error)}`);
    }

    const finalUsername = profileData.username;
    const finalFollowers = profileData.followers_count || 0;

    if (!finalUsername) {
      throw new Error("Could not retrieve username from Instagram API. Response: " + profileText);
    }

    console.log("Success! Username:", finalUsername, "Followers:", finalFollowers);

    return new Response(
      JSON.stringify({
        success: true,
        username: finalUsername,
        followers: finalFollowers,
        access_token: finalToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("Function Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
