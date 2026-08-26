import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!youtubeApiKey) {
      throw new Error('Missing YOUTUBE_API_KEY environment variable');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all YouTube social links
    const { data: youtubeLinks, error: fetchError } = await supabase
      .from('social_links')
      .select('id, profile_id, username, platform')
      .ilike('platform', 'youtube');

    if (fetchError) {
      throw fetchError;
    }

    if (!youtubeLinks || youtubeLinks.length === 0) {
      return new Response(JSON.stringify({ message: "No YouTube links to sync." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let updatedCount = 0;
    let failedCount = 0;
    let errors: any[] = [];
    let updatedProfiles = new Set<string>();

    for (const link of youtubeLinks) {
      try {
        let username = link.username;
        // In YouTube API v3, custom handles use `forHandle`. Legacy usernames use `forUsername`. 
        // We will try `forHandle=@username`.
        let queryParams = '';
        if (username.startsWith('@')) {
          queryParams = `forHandle=${username}`;
        } else {
          // If they didn't include the @, append it because custom handles usually have it.
          // In YouTube API, handles must start with '@'.
          queryParams = `forHandle=@${username}`;
        }
        
        const ytRes = await fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=statistics&${queryParams}&key=${youtubeApiKey}`);
        const ytData = await ytRes.json();

        if (ytData.items && ytData.items.length > 0) {
          const subscriberCount = parseInt(ytData.items[0].statistics.subscriberCount, 10) || 0;

          // Update social_links.followers
          const { error: updateError } = await supabase
            .from('social_links')
            .update({ 
              followers: subscriberCount
            })
            .eq('id', link.id);

          if (updateError) {
            console.error(`Failed to update social_links for ${username}:`, updateError);
            errors.push({ type: 'db_update', username, error: updateError });
            failedCount++;
          } else {
            updatedCount++;
            updatedProfiles.add(link.profile_id);
          }
        } else {
          console.error(`Failed to fetch from YouTube for ${username}:`, ytData);
          errors.push({ type: 'youtube_api_not_found', username, error: ytData });
          failedCount++;
        }
      } catch (err: any) {
        console.error(`Error processing channel ${link.username}:`, err);
        errors.push({ type: 'catch', username: link.username, error: err.message });
        failedCount++;
      }
    }

    // Now update profiles.follower_count by summing up their social_links
    for (const profileId of updatedProfiles) {
      try {
        const { data: allLinks, error: linksError } = await supabase
          .from('social_links')
          .select('followers')
          .eq('profile_id', profileId);
        
        if (!linksError && allLinks) {
          const totalFollowers = allLinks.reduce((sum, current) => sum + (current.followers || 0), 0);
          
          await supabase
            .from('profiles')
            .update({ follower_count: totalFollowers })
            .eq('id', profileId);
        }
      } catch (e) {
        console.error(`Failed to update profile follower_count for ${profileId}`, e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${updatedCount} YouTube channels. Failed: ${failedCount}.`,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in sync-youtube-stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
