import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all Instagram social links that have an access token
    const { data: igLinks, error: fetchError } = await supabase
      .from('social_links')
      .select('id, profile_id, username, platform, access_token')
      .ilike('platform', 'instagram')
      .not('access_token', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!igLinks || igLinks.length === 0) {
      return new Response(JSON.stringify({ message: "No Instagram links with access tokens found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let updatedCount = 0;
    let failedCount = 0;
    let errors: any[] = [];
    let updatedProfiles = new Set<string>();

    for (const link of igLinks) {
      try {
        const token = link.access_token;
        
        // Step 1: Get the Facebook Pages connected to this user
        // Fetch the follower count directly from Instagram Graph API
        const statsRes = await fetch(`https://graph.instagram.com/me?fields=followers_count&access_token=${token}`);
        const statsData = await statsRes.json();

        if (statsData.error) {
           console.error(`Graph API Error for ${link.username}:`, statsData.error);
           
           // Handle expired token (OAuthException code 190)
           if (statsData.error.code === 190) {
             console.log(`Token expired for ${link.username}, removing social link so user can reconnect.`);
             await supabase
               .from('social_links')
               .delete()
               .eq('id', link.id);
           }
           
           errors.push({ type: 'graph_api', username: link.username, error: statsData.error });
           failedCount++;
           continue;
        }


        if (statsData.followers_count !== undefined) {
          const subscriberCount = parseInt(statsData.followers_count, 10) || 0;

          // Update social_links.followers
          const { error: updateError } = await supabase
            .from('social_links')
            .update({ followers: subscriberCount })
            .eq('id', link.id);

          if (updateError) {
            errors.push({ type: 'db_update', username: link.username, error: updateError });
            failedCount++;
          } else {
            updatedCount++;
            updatedProfiles.add(link.profile_id);
          }
        } else {
          errors.push({ type: 'graph_api_stats', username: link.username, error: statsData });
          failedCount++;
        }
      } catch (err: any) {
        console.error(`Error processing Instagram channel ${link.username}:`, err);
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
        message: `Synced ${updatedCount} Instagram channels. Failed: ${failedCount}.`,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in sync-instagram-stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
