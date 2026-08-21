// ═══════════════════════════════════════════════════════════
// GINGER — Edge Function: Verify Video Views
// Cron job that checks YouTube/Instagram/TikTok APIs for view counts
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Submission {
  id: string;
  campaign_id: string;
  creator_id: string;
  video_url: string;
  platform: string;
  video_id: string;
  current_views: number;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pending submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, campaigns(*)')
      .eq('status', 'pending');

    if (error) throw error;
    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending submissions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const submission of submissions) {
      let viewCount = 0;

      // YouTube verification
      if (submission.platform === 'youtube' && youtubeApiKey && submission.video_id) {
        try {
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${submission.video_id}&key=${youtubeApiKey}`
          );
          const ytData = await ytResponse.json();
          if (ytData.items && ytData.items.length > 0) {
            viewCount = parseInt(ytData.items[0].statistics.viewCount, 10);
          }
        } catch (err) {
          console.error(`YouTube API error for ${submission.video_id}:`, err);
        }
      }

      // TODO: Add Instagram Graph API verification
      // TODO: Add TikTok API verification

      // Update submission with current views
      if (viewCount > 0) {
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ current_views: viewCount })
          .eq('id', submission.id);

        if (!updateError) {
          // Check if submission qualifies for payout
          const campaign = submission.campaigns;
          if (campaign) {
            const { data: tiers } = await supabase
              .from('payout_tiers')
              .select('*')
              .eq('campaign_id', campaign.id)
              .lte('min_views', viewCount)
              .order('min_views', { ascending: false })
              .limit(1);

            if (tiers && tiers.length > 0) {
              const qualifiedTier = tiers[0];
              
              // Mark as verified and set earned amount
              await supabase
                .from('submissions')
                .update({
                  status: 'verified',
                  earned_amount: qualifiedTier.payout_amount,
                  verified_at: new Date().toISOString(),
                })
                .eq('id', submission.id);

              results.push({
                submission_id: submission.id,
                views: viewCount,
                earned: qualifiedTier.payout_amount,
                status: 'verified',
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
