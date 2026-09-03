import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, userId, username, rapidApiKey: clientApiKey } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ACTION 1: Generate Instagram Verification Token
    if (action === "generate") {
      const hex = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .toUpperCase()
        .padStart(6, "0");
      const token = `verify-${hex}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ig_verification_token: token,
          ig_token_expires_at: expiresAt,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error saving IG token:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to generate verification token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token,
          expiresAt,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION 2: Verify Instagram Account via RapidAPI Bio Check
    if (action === "verify") {
      if (!username || typeof username !== "string" || !username.trim()) {
        return new Response(
          JSON.stringify({ error: "Please enter your Instagram username" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanUsername = username
        .trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/+$/, "")
        .trim();

      // 1. Fetch expected token and expiry from profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("ig_verification_token, ig_token_expires_at")
        .eq("id", userId)
        .single();

      if (profileErr || !profile?.ig_verification_token) {
        return new Response(
          JSON.stringify({ error: "No active verification code found. Please click Connect Instagram first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (profile.ig_token_expires_at) {
        const expiresAt = new Date(profile.ig_token_expires_at).getTime();
        if (Date.now() > expiresAt) {
          return new Response(
            JSON.stringify({ error: "Verification code has expired. Please generate a new code." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const expectedToken = profile.ig_verification_token.trim().toLowerCase();

      // 2. Fetch profile from RapidAPI Instagram Scraper
      const apiKey = Deno.env.get("RAPIDAPI_KEY") || clientApiKey || "";
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "RapidAPI key is not configured on the server. Please add RAPIDAPI_KEY secret." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rapidApiUrl = `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let rapidRes: Response;
      try {
        rapidRes = await fetch(rapidApiUrl, {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
          },
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === "AbortError") {
          return new Response(
            JSON.stringify({ error: "Instagram API request timed out. Please try again." }),
            { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: `Network error connecting to Instagram scraper: ${fetchErr.message}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!rapidRes.ok) {
        const errorText = await rapidRes.text();
        console.error("RapidAPI Error:", rapidRes.status, errorText);

        let parsedMsg = "";
        try {
          const parsed = JSON.parse(errorText);
          parsedMsg = parsed.message || parsed.error || "";
        } catch {}

        if (rapidRes.status === 403 && parsedMsg.toLowerCase().includes("not subscribed")) {
          return new Response(
            JSON.stringify({ 
              error: "RapidAPI Subscription Required: Your RapidAPI account must subscribe to 'instagram-scraper-api2' (Free plan). Visit https://rapidapi.com/rocky-rocky-default/api/instagram-scraper-api2/pricing and click 'Subscribe'." 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            error: parsedMsg ? `Instagram Scraper: ${parsedMsg}` : "Could not fetch Instagram profile. Please make sure the username is correct and public." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const responseJson = await rapidRes.json();
      const targetData = responseJson?.data || responseJson;
      const biography = (targetData?.biography || targetData?.bio || "").toString();
      const followerCount = parseInt(targetData?.follower_count ?? targetData?.followers ?? 0, 10) || 0;
      const finalUsername = targetData?.username || cleanUsername;

      // 3. Verify bio contains the token
      if (!biography.toLowerCase().includes(expectedToken)) {
        return new Response(
          JSON.stringify({
            error: "Token not found in bio. Ensure your profile is public and try again.",
            expectedToken: profile.ig_verification_token,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4. Token found! Update user record & social_links
      const { error: saveProfileErr } = await supabase
        .from("profiles")
        .update({
          ig_username: finalUsername,
          ig_followers_count: followerCount,
          ig_verification_token: null,
          ig_token_expires_at: null,
        })
        .eq("id", userId);

      if (saveProfileErr) {
        console.error("Error updating profile with IG data:", saveProfileErr);
      }

      // Update or insert social_links
      const { data: existingLink } = await supabase
        .from("social_links")
        .select("id")
        .eq("profile_id", userId)
        .ilike("platform", "instagram")
        .maybeSingle();

      if (existingLink) {
        await supabase
          .from("social_links")
          .update({
            username: finalUsername,
            url: `https://instagram.com/${finalUsername}`,
            followers: followerCount,
            verified: true,
          })
          .eq("id", existingLink.id);
      } else {
        await supabase.from("social_links").insert([
          {
            profile_id: userId,
            platform: "Instagram",
            username: finalUsername,
            url: `https://instagram.com/${finalUsername}`,
            followers: followerCount,
            verified: true,
          },
        ]);
      }

      return new Response(
        JSON.stringify({
          success: true,
          username: finalUsername,
          followerCount,
          message: "Instagram account verified and linked successfully!",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION 3: Unlink Instagram Account
    if (action === "unlink") {
      // 1. Clear profile fields
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("pinned_socials")
        .eq("id", userId)
        .single();

      const pinned = userProfile?.pinned_socials || [];
      const updatedPinned = pinned.filter(
        (p: string) => p.toLowerCase() !== "instagram"
      );

      await supabase
        .from("profiles")
        .update({
          ig_username: null,
          ig_followers_count: 0,
          ig_verification_token: null,
          ig_token_expires_at: null,
          pinned_socials: updatedPinned,
        })
        .eq("id", userId);

      // 2. Delete from social_links
      await supabase
        .from("social_links")
        .delete()
        .eq("profile_id", userId)
        .ilike("platform", "instagram");

      return new Response(
        JSON.stringify({ success: true, message: "Instagram unlinked successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Supported: generate, verify, unlink" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error in verify-instagram:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
