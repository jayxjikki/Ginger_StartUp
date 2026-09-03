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
      const codeOnly = expectedToken.replace(/^verify-/, "").trim();

      // 2. Fetch profile from RapidAPI Instagram Scraper
      const apiKey = Deno.env.get("RAPIDAPI_KEY") || clientApiKey || "";
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "RapidAPI key is not configured on the server. Please add RAPIDAPI_KEY secret." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let biography = "";
      let followerCount = 0;
      let finalUsername = cleanUsername;
      let lastErrorMessage = "";

      // Provider 1: Instagram Scraper Stable API
      try {
        const rapidApiUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php`;
        const postBody = new URLSearchParams({ username_or_url: cleanUsername }).toString();
        const p1Res = await fetch(rapidApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          },
          body: postBody,
        });

        if (p1Res.ok) {
          const json = await p1Res.json();
          const target = json?.data || json;
          biography = (target?.biography ?? target?.bio ?? "").toString();
          followerCount = parseInt(target?.follower_count ?? target?.followers ?? 0, 10) || 0;
          finalUsername = target?.username || cleanUsername;
        } else {
          const errText = await p1Res.text();
          try {
            const parsed = JSON.parse(errText);
            lastErrorMessage = parsed.message || parsed.error || errText;
          } catch {
            lastErrorMessage = errText;
          }
          console.warn("Provider 1 failed:", p1Res.status, lastErrorMessage);
        }
      } catch (err: any) {
        console.warn("Provider 1 error:", err.message);
      }

      // Provider 2 Fallback: instagram-scraper-api2
      if (!biography && !followerCount) {
        try {
          const p2Url = `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`;
          const p2Res = await fetch(p2Url, {
            method: "GET",
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
            },
          });

          if (p2Res.ok) {
            const json = await p2Res.json();
            const target = json?.data || json;
            biography = (target?.biography ?? target?.bio ?? "").toString();
            followerCount = parseInt(target?.follower_count ?? target?.followers ?? 0, 10) || 0;
            finalUsername = target?.username || cleanUsername;
          } else if (!lastErrorMessage) {
            const p2Err = await p2Res.text();
            try {
              const parsed = JSON.parse(p2Err);
              lastErrorMessage = parsed.message || parsed.error || p2Err;
            } catch {
              lastErrorMessage = p2Err;
            }
          }
        } catch (err: any) {
          console.warn("Provider 2 error:", err.message);
        }
      }

      // If neither scraper could fetch profile
      if (!biography && !followerCount) {
        if (lastErrorMessage.toLowerCase().includes("quota") || lastErrorMessage.toLowerCase().includes("exceeded")) {
          return new Response(
            JSON.stringify({ 
              error: "RapidAPI Monthly Quota Exceeded: Your plan on 'Instagram Scraper Stable API' ran out of requests. Please subscribe to 'instagram-scraper-api2' (Free Plan) on RapidAPI or use a fresh RapidAPI key." 
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            error: lastErrorMessage ? `Scraper Error: ${lastErrorMessage}` : "Could not fetch Instagram profile. Ensure the username is public." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Verify bio contains the token (matches either 'verify-XXXXXX' or 'XXXXXX')
      const bioLower = biography.toLowerCase();
      const isMatched = bioLower.includes(expectedToken) || (codeOnly.length >= 4 && bioLower.includes(codeOnly));

      if (!isMatched) {
        return new Response(
          JSON.stringify({
            error: `Code not found in bio. Checked bio of @${finalUsername}, but could not find "${profile.ig_verification_token}" or "${codeOnly}".`,
            expectedToken: profile.ig_verification_token,
            foundBio: biography ? biography.slice(0, 100) : "(empty bio)",
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
