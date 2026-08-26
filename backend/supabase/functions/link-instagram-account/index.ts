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

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok) {
      console.error("Token Exchange Error:", tokenData);
      throw new Error(`Failed to exchange code: ${tokenData.error_message || tokenData.error?.message || 'Unknown error'}`);
    }

    const shortLivedToken = tokenData.access_token;
    
    // Note: To be fully compliant long-term, you would exchange shortLivedToken for a long-lived token
    // via https://graph.instagram.com/access_token?grant_type=ig_exchange_token
    // For now, we will just use the short-lived token to get the user data immediately.

    // 2. Fetch user profile data and followers using the token
    const profileRes = await fetch(`https://graph.instagram.com/v20.0/me?fields=username,followers_count&access_token=${shortLivedToken}`);
    const profileData = await profileRes.json();

    if (!profileRes.ok) {
      console.error("Profile Fetch Error:", profileData);
      throw new Error(`Failed to fetch Instagram profile: ${profileData.error?.message || 'Unknown error'}`);
    }

    const finalUsername = profileData.username;
    const finalFollowers = profileData.followers_count || 0;

    if (!finalUsername) {
      throw new Error("Could not retrieve username from Instagram API");
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: finalUsername,
        followers: finalFollowers,
        access_token: shortLivedToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
