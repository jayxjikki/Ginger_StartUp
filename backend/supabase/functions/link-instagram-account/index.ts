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
    console.log("Token response status:", tokenRes.status, "body:", tokenText);
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      throw new Error(`Instagram returned non-JSON: ${tokenText}`);
    }

    if (!tokenData.access_token || !tokenData.user_id) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }

    const shortToken = tokenData.access_token;
    const userId = tokenData.user_id;
    console.log("Got token! user_id:", userId, "token prefix:", shortToken.substring(0, 10));

    // Step 2: Fetch profile - try multiple approaches with the Instagram API
    let username = '';
    let followers = 0;
    const errors: string[] = [];

    // Approach A: graph.instagram.com/v22.0/{user_id} with user_id,username fields
    // The new Instagram API uses "user_id" field (not "id")
    console.log("Step 2A: graph.instagram.com/v22.0/{user_id} with user_id,username...");
    try {
      const aRes = await fetch(
        `https://graph.instagram.com/v22.0/${userId}?fields=user_id,username,followers_count&access_token=${shortToken}`
      );
      const aText = await aRes.text();
      console.log("  A response:", aRes.status, aText);
      const aData = JSON.parse(aText);
      if (aData.username) {
        username = aData.username;
        followers = aData.followers_count || 0;
        console.log("  A SUCCESS:", username, followers);
      } else {
        errors.push(`A: ${aText}`);
      }
    } catch (e: any) {
      errors.push(`A: ${e.message}`);
    }

    // Approach B: graph.instagram.com/me with user_id,username fields (no version)
    if (!username) {
      console.log("Step 2B: graph.instagram.com/me with user_id,username (no version)...");
      try {
        const bRes = await fetch(
          `https://graph.instagram.com/me?fields=user_id,username&access_token=${shortToken}`
        );
        const bText = await bRes.text();
        console.log("  B response:", bRes.status, bText);
        const bData = JSON.parse(bText);
        if (bData.username) {
          username = bData.username;
          console.log("  B SUCCESS:", username);
        } else {
          errors.push(`B: ${bText}`);
        }
      } catch (e: any) {
        errors.push(`B: ${e.message}`);
      }
    }

    // Approach C: graph.instagram.com/{user_id} with NO fields (just access_token)
    if (!username) {
      console.log("Step 2C: graph.instagram.com/{user_id} with NO fields...");
      try {
        const cRes = await fetch(
          `https://graph.instagram.com/${userId}?access_token=${shortToken}`
        );
        const cText = await cRes.text();
        console.log("  C response:", cRes.status, cText);
        const cData = JSON.parse(cText);
        if (cData.username) {
          username = cData.username;
          followers = cData.followers_count || 0;
          console.log("  C SUCCESS:", username);
        } else if (cData.name) {
          username = cData.name;
          console.log("  C SUCCESS (name):", username);
        } else {
          errors.push(`C: ${cText}`);
        }
      } catch (e: any) {
        errors.push(`C: ${e.message}`);
      }
    }

    // Approach D: graph.instagram.com/v22.0/me with NO fields
    if (!username) {
      console.log("Step 2D: graph.instagram.com/v22.0/me with NO fields...");
      try {
        const dRes = await fetch(
          `https://graph.instagram.com/v22.0/me?access_token=${shortToken}`
        );
        const dText = await dRes.text();
        console.log("  D response:", dRes.status, dText);
        const dData = JSON.parse(dText);
        if (dData.username || dData.name) {
          username = dData.username || dData.name;
          followers = dData.followers_count || 0;
          console.log("  D SUCCESS:", username);
        } else {
          errors.push(`D: ${dText}`);
        }
      } catch (e: any) {
        errors.push(`D: ${e.message}`);
      }
    }

    if (!username) {
      throw new Error(`Could not fetch profile. All approaches failed: ${errors.join(' | ')}`);
    }

    console.log("=== FINAL:", username, followers, "===");

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