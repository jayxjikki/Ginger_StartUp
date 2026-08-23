const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in frontend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to fetch views from YouTube
async function fetchYouTubeViews(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    // Look for "viewCount":"123"
    const match = html.match(/"viewCount":"(\d+)"/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  } catch (err) {
    console.error(`Error fetching YouTube views for ${url}:`, err.message);
  }
  return null;
}

// Calculate earned amount based on payout tiers
async function calculateEarnings(campaignId, currentViews) {
  const { data: tiers, error } = await supabase
    .from('payout_tiers')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('min_views', { ascending: true });
    
  if (error || !tiers || tiers.length === 0) return 0;
  
  let earned = 0;
  for (const tier of tiers) {
    if (currentViews >= tier.min_views) {
      earned = tier.payout_amount;
    } else {
      break;
    }
  }
  return earned;
}

async function run() {
  console.log("Fetching submissions from Supabase...");
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('*')
    .in('status', ['pending', 'verified']);
    
  if (error) {
    console.error("Error fetching submissions:", error);
    process.exit(1);
  }
  
  if (!submissions || submissions.length === 0) {
    console.log("No pending or verified submissions found.");
    return;
  }
  
  console.log(`Found ${submissions.length} submissions. Updating views...`);
  
  let updatedCount = 0;
  
  for (const sub of submissions) {
    console.log(`Processing submission for campaign ${sub.campaign_id}, Platform: ${sub.platform}, URL: ${sub.video_url}`);
    
    let newViews = sub.current_views;
    
    if (sub.platform === 'youtube') {
      const liveViews = await fetchYouTubeViews(sub.video_url);
      if (liveViews !== null) {
        newViews = liveViews;
        console.log(`  -> Fetched live YouTube views: ${liveViews}`);
      } else {
        // Fallback random increment
        const increment = Math.floor(Math.random() * 500) + 100;
        newViews += increment;
        console.log(`  -> Could not fetch live views. Simulated increment by ${increment} to ${newViews}`);
      }
    } else {
      // For Instagram/TikTok/Other, just simulate for now as they block simple scraping
      const increment = Math.floor(Math.random() * 1000) + 200;
      newViews += increment;
      console.log(`  -> Simulated increment by ${increment} to ${newViews}`);
    }
    
    // Calculate new earnings based on views
    const newEarnings = await calculateEarnings(sub.campaign_id, newViews);
    
    // Determine status (if they hit first tier, maybe mark verified/paid, but let's just keep their status or update it)
    let newStatus = sub.status;
    if (newViews > 0 && sub.status === 'pending') {
      newStatus = 'verified'; // Auto-verify if they have views
    }
    
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        current_views: newViews,
        earned_amount: newEarnings,
        status: newStatus
      })
      .eq('id', sub.id);
      
    if (updateError) {
      console.error(`  ❌ Failed to update submission ${sub.id}:`, updateError);
    } else {
      console.log(`  ✅ Updated: ${newViews} views, ${newEarnings} earned, Status: ${newStatus}`);
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Successfully updated ${updatedCount} out of ${submissions.length} submissions!`);
}

run();
