/**
 * Express Router for Instagram Bio-Code Verification using RapidAPI
 * 
 * Dependencies:
 *   npm install express axios dotenv @supabase/supabase-js
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Initialize Supabase admin client (or your ORM / DB pool)
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 1. POST /api/generate-ig-token
 * Generates a 6-character random hex token prefixed with 'verify-'
 * and stores it with a 15-minute expiry for the authenticated user.
 */
router.post('/generate-ig-token', async (req, res) => {
  try {
    // Obtain authenticated userId from middleware or request body
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    // Generate random 6-character hex string prefixed with 'verify-' (e.g. verify-A7F9B2)
    const randomHex = Math.floor(Math.random() * 0xFFFFFF)
      .toString(16)
      .toUpperCase()
      .padStart(6, '0');
    const token = `verify-${randomHex}`;

    // 15-minute expiration timestamp
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Save token and expiry to database
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        ig_verification_token: token,
        ig_token_expires_at: expiresAt,
      })
      .eq('id', userId);

    if (dbError) {
      console.error('Database error saving token:', dbError);
      return res.status(500).json({ error: 'Failed to generate verification token' });
    }

    return res.status(200).json({
      success: true,
      token,
      expiresAt,
    });
  } catch (err) {
    console.error('Unexpected error in generate-ig-token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 2. POST /api/verify-instagram
 * Scrapes target user's Instagram bio via RapidAPI, confirms bio contains token,
 * updates follower_count, and marks account verified.
 */
router.post('/verify-instagram', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { username } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Instagram username is required' });
    }

    // Clean username (remove @ or URL prefixes)
    const cleanUsername = username
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .replace(/\/+$/, '')
      .trim();

    // 1. Fetch user's token and expiry from DB
    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('ig_verification_token, ig_token_expires_at')
      .eq('id', userId)
      .single();

    if (profileErr || !userProfile?.ig_verification_token) {
      return res.status(400).json({
        error: 'No active verification token found. Please click Connect Instagram first.',
      });
    }

    // 2. Validate token has not expired
    if (userProfile.ig_token_expires_at) {
      const expiresAt = new Date(userProfile.ig_token_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return res.status(400).json({
          error: 'Verification code has expired. Please generate a new code and try again.',
        });
      }
    }

    const expectedToken = userProfile.ig_verification_token.trim().toLowerCase();

    // 3. Make Axios request to RapidAPI Instagram Scraper
    const rapidApiKey = process.env.RAPIDAPI_KEY || req.body.rapidApiKey;
    if (!rapidApiKey) {
      return res.status(500).json({
        error: 'RapidAPI key not configured in environment variables (RAPIDAPI_KEY).',
      });
    }

    let rapidResponse;
    try {
      const postData = new URLSearchParams({ username_or_url: cleanUsername }).toString();
      rapidResponse = await axios.post('https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        },
        timeout: 15000, // 15 second timeout
      });
    } catch (apiErr) {
      console.error('RapidAPI Request Error:', apiErr.response?.data || apiErr.message);
      if (apiErr.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Instagram scraper request timed out. Please try again.' });
      }
      return res.status(400).json({
        error: 'Could not retrieve Instagram profile. Ensure the username is public and spelled correctly.',
      });
    }

    const rawData = rapidResponse.data?.data || rapidResponse.data;
    const biography = (rawData?.biography || rawData?.bio || '').toString();
    const followerCount = parseInt(rawData?.follower_count ?? rawData?.followers ?? 0, 10) || 0;
    const confirmedUsername = rawData?.username || cleanUsername;

    const codeOnly = expectedToken.replace(/^verify-/, '').trim();
    const bioLower = biography.toLowerCase();
    const isMatched = bioLower.includes(expectedToken) || (codeOnly.length >= 4 && bioLower.includes(codeOnly));

    // 4. Check if live biography contains the token (case-insensitive)
    if (!isMatched) {
      return res.status(400).json({
        error: `Token not found in bio. Checked bio of @${confirmedUsername}, but could not find "${userProfile.ig_verification_token}" or "${codeOnly}".`,
        expectedToken: userProfile.ig_verification_token,
      });
    }

    // 5. Success: update profile & social links, clear token
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        ig_username: confirmedUsername,
        ig_followers_count: followerCount,
        ig_verification_token: null,
        ig_token_expires_at: null,
      })
      .eq('id', userId);

    if (updateErr) {
      console.error('Failed to update profile after verification:', updateErr);
    }

    // Also sync to social_links
    const { data: existingLink } = await supabase
      .from('social_links')
      .select('id')
      .eq('profile_id', userId)
      .ilike('platform', 'instagram')
      .maybeSingle();

    if (existingLink) {
      await supabase
        .from('social_links')
        .update({
          username: confirmedUsername,
          url: `https://instagram.com/${confirmedUsername}`,
          followers: followerCount,
          verified: true,
        })
        .eq('id', existingLink.id);
    } else {
      await supabase.from('social_links').insert([
        {
          profile_id: userId,
          platform: 'Instagram',
          username: confirmedUsername,
          url: `https://instagram.com/${confirmedUsername}`,
          followers: followerCount,
          verified: true,
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      username: confirmedUsername,
      followerCount,
      message: 'Instagram account verified successfully!',
    });
  } catch (err) {
    console.error('Unexpected error in verify-instagram:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
